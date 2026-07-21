#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');
const SOP_TITLE = 'AIエージェント協働の実務SOP';

const CHAPTERS = Array.from({ length: 8 }, (_, index) =>
  `docs/chapters/chapter-${String(index + 1).padStart(2, '0')}/index.md`
);

const CHAPTER_TITLES = [
  '第1章：即効性のある活用法',
  '第2章：実務判断に必要な技術理解',
  '第3章：評価設計とモデル・ツール選定',
  '第4章：Prompt / Context Engineering の基礎',
  '第5章：複雑タスクの分解・実行・検証',
  '第6章：知識連携とツール連携',
  '第7章：組織導入と運用設計',
  '第8章：品質保証・リスク管理・コンプライアンス'
];

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

const ROOT_NAVIGATION_ANCHORS = new Map([
  ['quick-start', '最初に読むページ'],
  ['glossary-update-notes', 'Source・更新policy'],
  ['related-books', '関連書籍']
]);

function parseArgs(argv) {
  let root = DEFAULT_ROOT;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--root') {
      if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) {
        throw new Error('--root requires a path');
      }
      root = path.resolve(argv[index + 1]);
      index += 1;
    } else {
      throw new Error(`unknown argument: ${argv[index]}`);
    }
  }
  return { root };
}

function markdownHeadings(content) {
  const headings = new Set();
  let fenceCharacter = null;
  let fenceLength = 0;

  for (const line of content.split(/\r?\n/u)) {
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/u)?.[1];
    if (fence) {
      if (fenceCharacter === null) {
        fenceCharacter = fence[0];
        fenceLength = fence.length;
      } else if (fence[0] === fenceCharacter && fence.length >= fenceLength) {
        fenceCharacter = null;
        fenceLength = 0;
      }
      continue;
    }
    if (fenceCharacter === null && /^#{1,6}\s+\S/u.test(line)) headings.add(line.trim());
  }

  return headings;
}

function markdownLinks(content) {
  const links = [];
  let fenceCharacter = null;
  let fenceLength = 0;

  for (const line of content.split(/\r?\n/u)) {
    const fence = line.match(/^\s{0,3}(`{3,}|~{3,})/u)?.[1];
    if (fence) {
      if (fenceCharacter === null) {
        fenceCharacter = fence[0];
        fenceLength = fence.length;
      } else if (fence[0] === fenceCharacter && fence.length >= fenceLength) {
        fenceCharacter = null;
        fenceLength = 0;
      }
      continue;
    }
    if (fenceCharacter !== null) continue;
    for (const match of line.matchAll(/!?\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/gu)) {
      links.push(match[1].replace(/^<|>$/gu, ''));
    }
    for (const match of line.matchAll(/href="\{\{\s*'([^']+)'\s*\|\s*relative_url\s*\}\}(#[^"]*)?"/gu)) {
      links.push(`${match[1]}${match[2] ?? ''}`);
    }
    for (const match of line.matchAll(/href="\{\{\s*site\.baseurl\s*\}\}([^"#]*)(#[^"]*)?"/gu)) {
      links.push(`${match[1]}${match[2] ?? ''}`);
    }
  }

  return links;
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

function checkDocumentTitle(content, relativePath, title, failures) {
  if (!new RegExp(`^title:\\s*["']?${escapeRegExp(title)}["']?\\s*$`, 'mu').test(content)) {
    failures.push(`${relativePath}: front matter title must be ${JSON.stringify(title)}`);
  }
  if (!markdownHeadings(content).has(`# ${title}`)) {
    failures.push(`${relativePath}: H1 must be ${JSON.stringify(title)}`);
  }
}

function checkChapter(content, relativePath, title, failures) {
  const headings = markdownHeadings(content);
  for (const section of REQUIRED_CHAPTER_SECTIONS) {
    if (!headings.has(section)) failures.push(`${relativePath}: missing heading ${JSON.stringify(section)}`);
  }
  if (!/^---\r?\n[\s\S]*?\r?\n---\r?\n/u.test(content)) failures.push(`${relativePath}: front matter is missing`);
  if (!/^layout:\s*["']?book["']?\s*$/mu.test(content)) failures.push(`${relativePath}: layout must be book`);
  checkDocumentTitle(content, relativePath, title, failures);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
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

function checkSourceRegistry(content, relativePath, failures) {
  const headings = [...content.matchAll(/^### ([A-Z][A-Z0-9-]+)\s*$/gmu)];
  const entries = new Map();
  if (headings.length === 0) {
    failures.push(`${relativePath}: source registry entries are missing`);
    return entries;
  }

  const seen = new Set();
  const requiredFields = [
    '- **source type**:',
    '- **資料**:',
    '- **対象version/status**:',
    '- **確認日**: 2026-07-21',
    '- **支える章・主張**:',
    '- **再確認条件**:'
  ];

  for (const [index, heading] of headings.entries()) {
    const sourceId = heading[1];
    if (seen.has(sourceId)) failures.push(`${relativePath}: duplicate source ID ${sourceId}`);
    seen.add(sourceId);

    const start = heading.index + heading[0].length;
    const end = headings[index + 1]?.index ?? content.length;
    const entry = content.slice(start, end);
    entries.set(sourceId, entry);
    for (const field of requiredFields) {
      if (!entry.includes(field)) failures.push(`${relativePath}: ${sourceId} missing ${JSON.stringify(field)}`);
    }
  }

  return entries;
}

function checkSourceNoteCoverage(root, registryEntries, failures) {
  const sourceFiles = [
    ['導入', 'docs/introduction/index.md'],
    ['SOP', 'docs/introduction/agent-protocol.md'],
    ...CHAPTERS.map((relativePath, index) => [`第${index + 1}章`, relativePath])
  ];

  for (const [label, relativePath] of sourceFiles) {
    const content = read(root, relativePath, failures);
    const sourceNotesIndex = content.indexOf('## Source Notes');
    if (sourceNotesIndex < 0) continue;
    const sourceNotes = content.slice(sourceNotesIndex);
    const sourceIds = new Set(
      [...sourceNotes.matchAll(/appendix-b\/#([a-z0-9-]+)/giu)].map((match) => match[1].toUpperCase())
    );

    for (const sourceId of sourceIds) {
      const entry = registryEntries.get(sourceId);
      if (!entry) {
        failures.push(`${relativePath}: Source Notes references unknown source ID ${sourceId}`);
        continue;
      }
      const supportLine = entry.match(/^- \*\*支える章・主張\*\*: (.+)$/mu)?.[1] ?? '';
      if (!supportLine.includes(label)) {
        failures.push(`${relativePath}: ${sourceId} registry support metadata must include ${label}`);
      }
    }
  }
}

function parseNavigationTitles(content) {
  const titles = new Map();
  const pattern = /^\s*- title:\s*(.+?)\s*\r?\n\s+path:\s*(\/\S+)\s*$/gmu;
  for (const match of content.matchAll(pattern)) titles.set(match[2], match[1].replace(/^["']|["']$/gu, ''));
  return titles;
}

function checkCanonicalTitles(root, failures) {
  const navigationPath = 'docs/_data/navigation.yml';
  const navigationTitles = parseNavigationTitles(read(root, navigationPath, failures));
  const expectedNavigation = new Map([
    ['/introduction/agent-protocol/', SOP_TITLE],
    ...CHAPTER_TITLES.map((title, index) => [`/chapters/chapter-${String(index + 1).padStart(2, '0')}/`, title])
  ]);

  let book = {};
  try {
    book = JSON.parse(read(root, 'book-config.json', failures));
  } catch (error) {
    failures.push(`book-config.json: ${error instanceof Error ? error.message : String(error)}`);
  }

  const configuredChapters = new Map((book.structure?.chapters ?? []).map((item) => [item.id, item.title]));
  for (const [index, title] of CHAPTER_TITLES.entries()) {
    const id = `chapter${String(index + 1).padStart(2, '0')}`;
    if (configuredChapters.get(id) !== title) {
      failures.push(`book-config.json: ${id} title must be ${JSON.stringify(title)}`);
    }
  }

  for (const appendix of book.structure?.appendices ?? []) {
    const relativePath = `docs/appendices/${appendix.id}.md`;
    const navigationPathname = `/appendices/${appendix.id}/`;
    checkDocumentTitle(read(root, relativePath, failures), relativePath, appendix.title, failures);
    expectedNavigation.set(navigationPathname, appendix.title);
  }

  for (const [pathname, title] of expectedNavigation) {
    if (navigationTitles.get(pathname) !== title) {
      failures.push(`${navigationPath}: ${pathname} title must be ${JSON.stringify(title)}`);
    }
  }
}

function checkRootNavigationAnchors(root, failures) {
  const indexPath = 'docs/index.md';
  const sidebarPath = 'docs/_includes/sidebar-nav.html';
  const index = read(root, indexPath, failures);
  const sidebar = read(root, sidebarPath, failures);

  for (const [id, heading] of ROOT_NAVIGATION_ANCHORS) {
    const anchorPattern = new RegExp(`^## ${escapeRegExp(heading)}\\r?\\n\\{:\\s*#${escapeRegExp(id)}\\s*\\}$`, 'mu');
    if (!anchorPattern.test(index)) {
      failures.push(`${indexPath}: heading ${JSON.stringify(heading)} must define stable anchor #${id}`);
    }
    const sidebarTarget = `{{ '/' | relative_url }}#${id}`;
    if (!sidebar.includes(sidebarTarget)) {
      failures.push(`${sidebarPath}: missing root navigation target ${JSON.stringify(sidebarTarget)}`);
    }
  }
}

function walkMarkdownFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdownFiles(absolutePath));
    else if (entry.isFile() && entry.name.endsWith('.md')) files.push(absolutePath);
  }
  return files;
}

function publishedRoute(relativePath) {
  const pathFromDocs = relativePath.replace(/^docs\//u, '');
  if (pathFromDocs === 'index.md') return '/';
  if (pathFromDocs.endsWith('/index.md')) return `/${pathFromDocs.slice(0, -'index.md'.length)}`;
  return `/${pathFromDocs.slice(0, -'.md'.length)}/`;
}

function routeTargetExists(root, pathname, baseurl) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return false;
  }
  if (baseurl && (decoded === baseurl || decoded.startsWith(`${baseurl}/`))) {
    decoded = decoded.slice(baseurl.length) || '/';
  }
  const relative = decoded.replace(/^\/+|\/+$/gu, '');
  const candidates = relative.length === 0
    ? ['docs/index.md']
    : [`docs/${relative}/index.md`, `docs/${relative}.md`, `docs/${relative}`];
  return candidates.some((candidate) => {
    const absolutePath = path.join(root, candidate);
    return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile();
  });
}

function checkPublishedRouteLinks(root, failures) {
  const docsRoot = path.join(root, 'docs');
  const config = read(root, 'docs/_config.yml', failures);
  const baseurl = config.match(/^baseurl:\s*["']?([^"'\s]+)["']?\s*$/mu)?.[1]?.replace(/\/$/u, '') ?? '';
  for (const absolutePath of walkMarkdownFiles(docsRoot)) {
    const relativePath = path.relative(root, absolutePath).split(path.sep).join('/');
    const sourceRoute = publishedRoute(relativePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    for (const target of markdownLinks(content)) {
      if (target.startsWith('#') || /^[a-z][a-z0-9+.-]*:/iu.test(target) || target.startsWith('//')) continue;
      const resolved = new URL(target, new URL(sourceRoute, 'https://book.invalid')).pathname;
      if (!routeTargetExists(root, resolved, baseurl)) {
        failures.push(`${relativePath}: ${JSON.stringify(target)} resolves to missing published route ${resolved}`);
      }
    }
  }
}

export function checkEditorialContract(root = DEFAULT_ROOT) {
  const failures = [];
  const chapterContents = new Map();

  checkCanonicalTitles(root, failures);
  checkRootNavigationAnchors(root, failures);
  checkPublishedRouteLinks(root, failures);

  for (const [index, chapter] of CHAPTERS.entries()) {
    const content = read(root, chapter, failures);
    chapterContents.set(chapter, content);
    checkChapter(content, chapter, CHAPTER_TITLES[index], failures);
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

  const chapter7 = chapterContents.get(CHAPTERS[6]) ?? '';
  for (const term of ['Request ContractのOwnerとの対応', 'RACIのAccountable', 'metric owner']) {
    requireText(chapter7, CHAPTERS[6], term, failures);
  }

  const appendixBPath = 'docs/appendices/appendix-b.md';
  const appendixB = read(root, appendixBPath, failures);
  for (const term of ['source hierarchy', '2026-07-21', '確認日', '対象version/status', '支える章・主張', '再確認条件']) {
    requireText(appendixB, appendixBPath, term, failures);
  }
  const registryEntries = checkSourceRegistry(appendixB, appendixBPath, failures);
  checkSourceNoteCoverage(root, registryEntries, failures);

  const appendixEPath = 'docs/appendices/appendix-e.md';
  const appendixE = read(root, appendixEPath, failures);
  for (const term of ['2026-07-21', '公式情報', '再確認']) requireText(appendixE, appendixEPath, term, failures);

  const protocolPath = 'docs/introduction/agent-protocol.md';
  const protocol = read(root, protocolPath, failures);
  checkDocumentTitle(protocol, protocolPath, SOP_TITLE, failures);
  for (const term of ['承認ゲート', '停止条件', '検証', '証拠', '責任分界', 'RACIのAccountable', 'source owner', 'tool owner', 'metric owner']) {
    requireText(protocol, protocolPath, term, failures);
  }

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
