#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const errors = [];

function readText(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

function stripQuotes(value) {
  const trimmed = String(value ?? '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function readSimpleYaml(relativePath) {
  const data = {};
  for (const line of readText(relativePath).split(/\r?\n/u)) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/u);
    if (!match) continue;
    data[match[1]] = stripQuotes(match[2]);
  }
  return data;
}

function readFrontMatter(relativePath) {
  const text = readText(relativePath);
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/u);
  if (!match) {
    errors.push(`${relativePath}: front matter is missing`);
    return {};
  }
  const data = {};
  for (const line of match[1].split(/\r?\n/u)) {
    const item = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/u);
    if (!item) continue;
    data[item[1]] = stripQuotes(item[2]);
  }
  return data;
}

function normalizeRepoUrl(value) {
  return stripQuotes(value).replace(/\.git$/u, '').replace(/\/$/u, '');
}

function normalizeUrl(value) {
  return stripQuotes(value).replace(/\/$/u, '') + '/';
}

function expectEqual(label, actual, expected) {
  if (actual !== expected) {
    errors.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function asciiLower(value) {
  return String(value ?? '').replace(/[A-Z]/gu, (char) => char.toLowerCase());
}

function expectUrl(label, actual, expected) {
  expectEqual(label, normalizeUrl(actual), normalizeUrl(expected));
}

function expectRepoUrl(label, actual, expected) {
  expectEqual(label, normalizeRepoUrl(actual), normalizeRepoUrl(expected));
}

const pkg = readJson('package.json');
const lock = readJson('package-lock.json');
const book = readJson('book-config.json');
const jekyll = readSimpleYaml('docs/_config.yml');
const index = readFrontMatter('docs/index.md');

const repoUrl = book.repository?.url;
const pagesUrl = `${jekyll.url}${jekyll.baseurl}/`;

expectEqual('package.json name vs book-config title (ASCII case-insensitive)', asciiLower(pkg.name), asciiLower(book.title));
expectEqual('package.json version vs book-config version', pkg.version, book.version);
expectEqual('package-lock root name vs package.json name', lock.name, pkg.name);
expectEqual('package-lock root version vs package.json version', lock.version, pkg.version);
expectEqual('package.json description vs book-config description', pkg.description, book.description);
expectEqual('docs/_config.yml title vs book-config title', jekyll.title, book.title);
expectEqual('docs/_config.yml description vs book-config description', jekyll.description, book.description);
expectEqual('docs/_config.yml version vs book-config version', jekyll.version, book.version);
expectEqual('docs/index.md title vs book-config title', index.title, book.title);
expectEqual('docs/index.md description vs book-config description', index.description, book.description);
expectEqual('docs/index.md version vs book-config version', index.version, book.version);
expectRepoUrl('package.json repository.url vs book-config repository.url', pkg.repository?.url, repoUrl);
expectUrl('package.json homepage vs docs/_config.yml site URL', pkg.homepage, pagesUrl);
expectUrl('package.json bugs.url vs GitHub Issues URL', pkg.bugs?.url, `${repoUrl}/issues`);

if (!jekyll.baseurl?.startsWith('/')) {
  errors.push(`docs/_config.yml baseurl must start with '/': ${JSON.stringify(jekyll.baseurl)}`);
}

if (errors.length > 0) {
  console.error('Metadata consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Metadata consistency check passed.');
