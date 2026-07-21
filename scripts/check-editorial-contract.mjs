#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');

const CHAPTERS = Array.from({ length: 8 }, (_, index) =>
  `docs/chapters/chapter-${String(index + 1).padStart(2, '0')}/index.md`
);

const REQUIRED_CHAPTER_SECTIONS = [
  '## この章の使い方',
  '### 誰向け',
  '### この章でできるようになること',
  '### 最短ルート',
  '### 深掘りルート',
  '## 章末まとめ',
  '## 実務チェックリスト',
  '## 次に読む章・参照付録',
  '## Source Notes'
];

const FORBIDDEN_PATTERNS = [
  [/創発(?:的能力)?の発現条件/u, '未確立の創発閾値を実務判断の根拠にしない'],
  [/既知の創発閾値/u, '推測的な創発閾値を既知の事実として扱わない'],
  [/次の創発予測/u, '未検証の能力予測を掲載しない'],
  [/思考過程(?:を|の)逐語的/u, '逐語的なhidden reasoningの開示を要求しない'],
  [/思考プロセスの外部化/u, 'hidden reasoningではなく検証可能な中間成果物を要求する']
];

function parseArgs(argv) {
  let root = DEFAULT_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--root') {
      root = path.resolve(argv[index + 1] ?? '');
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argv[index]}`);
    }
  }
  return { root };
}

function read(root, relativePath, failures) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    failures.push(`${relativePath}: file is missing`);
    return '';
  }
  return fs.readFileSync(absolutePath, 'utf8');
}

function requireText(content, relativePath, needle, failures) {
  if (!content.includes(needle)) failures.push(`${relativePath}: missing ${JSON.stringify(needle)}`);
}

function checkChapter(content, relativePath, failures) {
  for (const section of REQUIRED_CHAPTER_SECTIONS) requireText(content, relativePath, section, failures);
  if (!/^---\r?\n[\s\S]*?\r?\n---\r?\n/u.test(content)) failures.push(`${relativePath}: front matter is missing`);
  if (!/^layout:\s*["']?book["']?\s*$/mu.test(content)) failures.push(`${relativePath}: layout must be book`);
}

function checkPercentClaims(content, relativePath, failures) {
  const lines = content.split(/\r?\n/u);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (!/\d+(?:\.\d+)?\s*[%％]/u.test(line)) continue;
    const context = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join(' ');
    if (!/(?:実測|仮定|目標|出典付き|benchmark|ベンチマーク|例示|サンプル)/iu.test(context)) {
      failures.push(`${relativePath}:${index + 1}: percentage must be classified as 実測/仮定/目標/出典付きbenchmark/例示`);
    }
  }
}

export function checkEditorialContract(root = DEFAULT_ROOT) {
  const failures = [];
  const chapterContents = new Map();

  for (const chapter of CHAPTERS) {
    const content = read(root, chapter, failures);
    chapterContents.set(chapter, content);
    checkChapter(content, chapter, failures);
    for (const [pattern, reason] of FORBIDDEN_PATTERNS) {
      if (pattern.test(content)) failures.push(`${chapter}: ${reason}`);
    }
  }

  checkPercentClaims(chapterContents.get(CHAPTERS[0]) ?? '', CHAPTERS[0], failures);
  checkPercentClaims(chapterContents.get(CHAPTERS[6]) ?? '', CHAPTERS[6], failures);

  const chapter1 = chapterContents.get(CHAPTERS[0]) ?? '';
  for (const role of ['ビジネス職', 'プロジェクトマネージャー', 'エンジニア', 'マネージャー']) {
    requireText(chapter1, CHAPTERS[0], role, failures);
  }

  const chapter3 = chapterContents.get(CHAPTERS[2]) ?? '';
  for (const term of ['offline eval', 'regression eval', 'workflow-level acceptance check', 'human review']) {
    requireText(chapter3, CHAPTERS[2], term, failures);
  }

  const chapter5 = chapterContents.get(CHAPTERS[4]) ?? '';
  for (const term of ['中間成果物', 'completeness check', 'failure recovery']) {
    requireText(chapter5, CHAPTERS[4], term, failures);
  }

  const chapter6 = chapterContents.get(CHAPTERS[5]) ?? '';
  for (const term of ['MCP', 'structured output', 'アクセス制御', 'timeout', 'retry', 'logging']) {
    requireText(chapter6, CHAPTERS[5], term, failures);
  }

  const chapter8 = chapterContents.get(CHAPTERS[7]) ?? '';
  for (const term of ['prompt injection', 'insecure output handling', 'data leakage', 'excessive autonomy', '保持期間', 'マスキング', '削除', '保全', '監査責任者']) {
    requireText(chapter8, CHAPTERS[7], term, failures);
  }

  const appendixBPath = 'docs/appendices/appendix-b.md';
  const appendixB = read(root, appendixBPath, failures);
  for (const term of ['source hierarchy', '2026-07-21', '確認日', '対象version/status', '支える章・主張', '再確認条件']) {
    requireText(appendixB, appendixBPath, term, failures);
  }

  const appendixEPath = 'docs/appendices/appendix-e.md';
  const appendixE = read(root, appendixEPath, failures);
  for (const term of ['2026-07-21', '公式情報', '再確認']) requireText(appendixE, appendixEPath, term, failures);

  const protocolPath = 'docs/introduction/agent-protocol.md';
  const protocol = read(root, protocolPath, failures);
  for (const term of ['承認ゲート', '停止条件', '検証', '証拠', '責任分界']) requireText(protocol, protocolPath, term, failures);

  return failures;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const { root } = parseArgs(process.argv.slice(2));
    const failures = checkEditorialContract(root);
    if (failures.length > 0) {
      console.error('Editorial contract check failed:');
      for (const failure of failures) console.error(`- ${failure}`);
      process.exit(1);
    }
    console.log(`Editorial contract passed: ${CHAPTERS.length} chapters, SOP, appendices B/E`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
  }
}
