#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { checkEditorialContract } from './check-editorial-contract.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMP_PARENT = path.join(ROOT, '.codex-local', 'tmp');
fs.mkdirSync(TEMP_PARENT, { recursive: true });

function removeDirectoryIfEmpty(directory) {
  try {
    fs.rmdirSync(directory);
  } catch (error) {
    if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error?.code)) throw error;
  }
}

process.once('exit', () => {
  removeDirectoryIfEmpty(TEMP_PARENT);
  removeDirectoryIfEmpty(path.dirname(TEMP_PARENT));
});

function replaceOnce(file, before, after) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes(before)) throw new Error(`regression fixture marker is missing: ${before}`);
  fs.writeFileSync(file, content.replace(before, after));
}

function replaceAll(file, before, after) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes(before)) throw new Error(`regression fixture marker is missing: ${before}`);
  fs.writeFileSync(file, content.replaceAll(before, after));
}

function replaceLast(file, before, after) {
  const content = fs.readFileSync(file, 'utf8');
  const index = content.lastIndexOf(before);
  if (index < 0) throw new Error(`regression fixture marker is missing: ${before}`);
  fs.writeFileSync(file, `${content.slice(0, index)}${after}${content.slice(index + before.length)}`);
}

const cases = [
  {
    name: 'missing chapter contract section',
    mutate(root) {
      replaceOnce(path.join(root, 'docs/chapters/chapter-03/index.md'), '## Source Notes', '## Sources');
    }
  },
  {
    name: 'chapter title drifts from the canonical navigation title',
    mutate(root) {
      replaceOnce(path.join(root, 'docs/chapters/chapter-01/index.md'), '第1章：即効性のある活用法', '第1章：別の章題');
    }
  },
  {
    name: 'hidden reasoning wording returns',
    mutate(root) {
      replaceOnce(path.join(root, 'docs/chapters/chapter-04/index.md'), '## 章末まとめ', '思考プロセスの外部化\n\n## 章末まとめ');
    }
  },
  {
    name: 'unclassified percentage returns',
    mutate(root) {
      replaceOnce(path.join(root, 'docs/chapters/chapter-01/index.md'), '## 章末まとめ', '作業時間を50%短縮できます。\n\n## 章末まとめ');
    }
  },
  {
    name: 'source verification date disappears',
    mutate(root) {
      replaceAll(path.join(root, 'docs/appendices/appendix-b.md'), '2026-07-21', 'DATE-REMOVED');
    }
  },
  {
    name: 'one source registry entry loses its recheck condition',
    mutate(root) {
      replaceOnce(path.join(root, 'docs/appendices/appendix-b.md'), '- **再確認条件**:', '- **更新メモ**:');
    }
  },
  {
    name: 'source registry support metadata loses a citing chapter',
    mutate(root) {
      replaceOnce(
        path.join(root, 'docs/appendices/appendix-b.md'),
        '第1章、第3章、第5章、第8章。task-specific dataset',
        '第3章、第5章、第8章。task-specific dataset'
      );
    }
  },
  {
    name: 'a Liquid Source Notes link references an unknown source ID',
    mutate(root) {
      replaceOnce(
        path.join(root, 'docs/introduction/agent-protocol.md'),
        "'/appendices/appendix-b/' | relative_url }}#nist-airmf\"",
        "'/appendices/appendix-b/' | relative_url }}#nist-airmf-typo\""
      );
    }
  },
  {
    name: 'owner role mapping disappears',
    mutate(root) {
      replaceOnce(
        path.join(root, 'docs/chapters/chapter-07/index.md'),
        '### Request ContractのOwnerとの対応',
        '### 担当者の例'
      );
    }
  },
  {
    name: 'a heading inside a code fence cannot replace the real Source Notes heading',
    mutate(root) {
      replaceLast(path.join(root, 'docs/chapters/chapter-04/index.md'), '## Source Notes', '## Sources');
    }
  },
  {
    name: 'appendix navigation title drifts from the canonical title',
    mutate(root) {
      replaceOnce(
        path.join(root, 'docs/_data/navigation.yml'),
        '付録C：成果物テンプレート集（ADR/PR/Runbook/ポストモーテム）',
        '付録C：成果物テンプレート集'
      );
    }
  },
  {
    name: 'a source-valid appendix link resolves to a missing published route',
    mutate(root) {
      replaceOnce(
        path.join(root, 'docs/appendices/appendix-a.md'),
        "'/appendices/appendix-c/' | relative_url",
        "'/appendices/appendix-a/appendix-c/' | relative_url"
      );
    }
  },
  {
    name: 'a site.baseurl link resolves to a missing published route',
    mutate(root) {
      replaceOnce(
        path.join(root, 'docs/appendices/appendix-c.md'),
        '{{ site.baseurl }}/chapters/chapter-05/',
        '{{ site.baseurl }}/appendices/appendix-c/chapters/chapter-05/'
      );
    }
  },
  {
    name: 'a stable root navigation anchor disappears',
    mutate(root) {
      replaceOnce(path.join(root, 'docs/index.md'), '{: #related-books }', '{: #related-reading }');
    }
  },
  {
    name: 'a sidebar root navigation target disappears',
    mutate(root) {
      replaceOnce(
        path.join(root, 'docs/_includes/sidebar-nav.html'),
        "{{ '/' | relative_url }}#related-books",
        "{{ '/' | relative_url }}#related-reading"
      );
    }
  }
];

let passed = 0;
const missingRootArgument = spawnSync(process.execPath, [path.join(ROOT, 'scripts/check-editorial-contract.mjs'), '--root'], {
  encoding: 'utf8'
});
if (missingRootArgument.status === 0 || !`${missingRootArgument.stdout}${missingRootArgument.stderr}`.includes('--root requires a path')) {
  throw new Error('missing --root value: CLI did not fail with the expected diagnostic');
}
passed += 1;

for (const testCase of cases) {
  const tempRoot = fs.mkdtempSync(path.join(TEMP_PARENT, 'editorial-contract-'));
  try {
    fs.cpSync(path.join(ROOT, 'docs'), path.join(tempRoot, 'docs'), { recursive: true });
    fs.copyFileSync(path.join(ROOT, 'book-config.json'), path.join(tempRoot, 'book-config.json'));
    testCase.mutate(tempRoot);
    const failures = checkEditorialContract(tempRoot);
    if (failures.length === 0) throw new Error(`${testCase.name}: checker accepted the invalid fixture`);
    passed += 1;
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

const positive = checkEditorialContract(ROOT);
if (positive.length > 0) {
  console.error('positive fixture failed:');
  for (const failure of positive) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Editorial contract regression passed: negative ${passed}/${cases.length + 1}, positive 1/1`);
