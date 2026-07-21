#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDependencyMetadata } from './check-dependency-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMP_PARENT = path.join(ROOT, '.codex-local', 'tmp');
fs.mkdirSync(TEMP_PARENT, { recursive: true });

const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const packageLock = JSON.parse(fs.readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));

const cases = [
  {
    name: 'deprecated dependency returns',
    mutate(_pkg, lock) {
      lock.packages['node_modules/whatwg-encoding'] = { version: '3.1.1' };
    }
  },
  {
    name: 'encoding override drifts',
    mutate(pkg) {
      pkg.overrides['encoding-sniffer'] = '0.2.1';
    }
  },
  {
    name: 'brace-expansion lock regresses',
    mutate(_pkg, lock) {
      lock.packages['node_modules/brace-expansion'].version = '5.0.6';
    }
  },
  {
    name: 'js-yaml lock regresses',
    mutate(_pkg, lock) {
      lock.packages['node_modules/js-yaml'].version = '4.2.0';
    }
  },
  {
    name: 'declared Node.js floor no longer covers installed dependencies',
    mutate(pkg, lock) {
      pkg.engines.node = '>=22.12.0';
      lock.packages[''].engines.node = '>=22.12.0';
    }
  }
];

let passed = 0;
for (const testCase of cases) {
  const tempRoot = fs.mkdtempSync(path.join(TEMP_PARENT, 'dependency-contract-regression-'));
  try {
    const pkg = structuredClone(packageJson);
    const lock = structuredClone(packageLock);
    testCase.mutate(pkg, lock);
    fs.writeFileSync(path.join(tempRoot, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
    fs.writeFileSync(path.join(tempRoot, 'package-lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
    const failures = checkDependencyMetadata(tempRoot);
    if (failures.length === 0) throw new Error(`${testCase.name}: checker accepted the invalid fixture`);
    passed += 1;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

const positive = checkDependencyMetadata(ROOT);
if (positive.length > 0) {
  console.error('positive fixture failed:');
  for (const failure of positive) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Dependency contract regression passed: negative ${passed}/${cases.length}, positive 1/1`);
