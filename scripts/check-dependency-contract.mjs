#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');

const EXPECTED_OVERRIDES = {
  'encoding-sniffer': '1.0.2',
  'brace-expansion': '5.0.7',
  'js-yaml': '5.2.1'
};

const EXPECTED_LOCK_VERSIONS = {
  'node_modules/markdown-link-check': '3.14.2',
  'node_modules/cheerio': '1.2.0',
  'node_modules/xmlbuilder2': '4.0.3',
  'node_modules/encoding-sniffer': '1.0.2',
  'node_modules/brace-expansion': '5.0.7',
  'node_modules/js-yaml': '5.2.1',
  'node_modules/markdownlint-cli': '0.49.1'
};

const EXPECTED_OVERRIDE_CONSUMERS = {
  'encoding-sniffer': ['node_modules/cheerio'],
  'brace-expansion': ['node_modules/minimatch'],
  'js-yaml': ['node_modules/markdownlint-cli', 'node_modules/xmlbuilder2']
};

function removeDirectoryIfEmpty(directory) {
  try {
    fs.rmdirSync(directory);
  } catch (error) {
    if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error?.code)) throw error;
  }
}

function readJson(root, relativePath, failures) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
  } catch (error) {
    failures.push(`${relativePath}: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

export function checkDependencyMetadata(root = DEFAULT_ROOT) {
  const failures = [];
  const pkg = readJson(root, 'package.json', failures);
  const lock = readJson(root, 'package-lock.json', failures);
  const packages = lock.packages ?? {};

  if (pkg.devDependencies?.['markdownlint-cli'] !== '^0.49.1') {
    failures.push('package.json: markdownlint-cli must be pinned to ^0.49.1');
  }
  if (pkg.engines?.node !== '^22.22.2 || ^24.15.0 || >=26.0.0') {
    failures.push(
      'package.json: Node.js engine must match the supported-major union required by transitive ini@7 (^22.22.2 || ^24.15.0 || >=26.0.0)'
    );
  }
  if (packages['']?.engines?.node !== pkg.engines?.node) {
    failures.push('package-lock.json: root Node.js engine must match package.json');
  }

  for (const [name, version] of Object.entries(EXPECTED_OVERRIDES)) {
    if (pkg.overrides?.[name] !== version) {
      failures.push(`package.json: override ${name} must be ${version}`);
    }
  }

  for (const [packagePath, version] of Object.entries(EXPECTED_LOCK_VERSIONS)) {
    if (packages[packagePath]?.version !== version) {
      failures.push(`package-lock.json: ${packagePath} must resolve to ${version}`);
    }
  }

  for (const [dependency, expectedConsumers] of Object.entries(EXPECTED_OVERRIDE_CONSUMERS)) {
    const actualConsumers = Object.entries(packages)
      .filter(([, metadata]) => Object.hasOwn(metadata.dependencies ?? {}, dependency))
      .map(([packagePath]) => packagePath)
      .sort();
    if (JSON.stringify(actualConsumers) !== JSON.stringify(expectedConsumers)) {
      failures.push(
        `package-lock.json: ${dependency} override consumers must remain ${expectedConsumers.join(', ')}; got ${actualConsumers.join(', ')}`
      );
    }
  }

  if (Object.hasOwn(packages, 'node_modules/whatwg-encoding')) {
    failures.push('package-lock.json: deprecated whatwg-encoding must not be installed');
  }

  return failures;
}

async function checkRuntimeCompatibility(root, failures) {
  try {
    const { decodeBuffer, getEncoding } = await import('encoding-sniffer');
    const cheerio = await import('cheerio');
    const jsYaml = await import('js-yaml');
    const { create } = await import('xmlbuilder2');

    const html = Buffer.from('<meta charset="utf-8"><p>日本語</p>');
    if (getEncoding(html) !== 'UTF-8' || !decodeBuffer(html).includes('日本語')) {
      failures.push('encoding-sniffer: UTF-8 decoding compatibility smoke failed');
    }

    const $ = cheerio.loadBuffer(html);
    if ($('p').text() !== '日本語') failures.push('cheerio: loadBuffer compatibility smoke failed');

    const yaml = jsYaml.load('root:\n  item: ok\n');
    if (yaml?.root?.item !== 'ok' || !jsYaml.dump(yaml).includes('item: ok')) {
      failures.push('js-yaml: load/dump compatibility smoke failed');
    }

    const xml = create({ version: '1.0' }).ele('root').ele('item').txt('ok').end({ prettyPrint: false });
    if (!xml.includes('<item>ok</item>')) failures.push('xmlbuilder2: XML writer compatibility smoke failed');
  } catch (error) {
    failures.push(`runtime dependency compatibility: ${error instanceof Error ? error.message : String(error)}`);
  }

  const tempParent = path.join(root, '.codex-local', 'tmp');
  fs.mkdirSync(tempParent, { recursive: true });
  const tempDirectory = fs.mkdtempSync(path.join(tempParent, 'dependency-contract-'));
  try {
    const input = path.join(tempDirectory, 'input.md');
    const report = path.join(tempDirectory, 'report.xml');
    fs.writeFileSync(input, '# Dependency compatibility smoke\n');
    execFileSync(
      path.join(root, 'node_modules', '.bin', 'markdown-link-check'),
      ['--reporters', 'junit', '--junit-output', report, input],
      { cwd: root, stdio: 'pipe' }
    );
    const reportText = fs.readFileSync(report, 'utf8');
    if (!reportText.includes('<testsuite')) failures.push('markdown-link-check: JUnit reporter smoke failed');
  } catch (error) {
    failures.push(`markdown-link-check compatibility: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    fs.rmSync(tempDirectory, { recursive: true, force: true });
    removeDirectoryIfEmpty(tempParent);
    removeDirectoryIfEmpty(path.dirname(tempParent));
  }
}

export async function checkDependencyContract(root = DEFAULT_ROOT, options = {}) {
  const failures = checkDependencyMetadata(root);
  if (!options.staticOnly && failures.length === 0) await checkRuntimeCompatibility(root, failures);
  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const failures = await checkDependencyContract(DEFAULT_ROOT);
  if (failures.length > 0) {
    console.error('Dependency contract check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }
  console.log('Dependency contract passed: audited overrides, lockfile, runtime APIs, and JUnit reporter');
}
