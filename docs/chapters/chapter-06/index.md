---
title: "第6章：知識連携とツール連携"
chapter: chapter06
layout: book
order: 8
---

# 第6章：知識連携とツール連携

業務systemでは、すべての情報をpromptへ埋め込むことも、すべてをmodelに記憶させることもできません。必要な知識を検索し、外部作用をtoolへ委譲し、結果を検証するarchitectureが必要です。本章ではcontext、retrieval、tool useを一つの設計問題として扱います。

## この章の使い方

### 誰向け

- 社内knowledge検索やRAGを設計するエンジニア
- AIと業務APIを接続するsolution architect
- MCP server/client、tool schema、権限をreviewするsecurity担当
- fine-tuningやmulti-agentを採用する前に代替案を比較したいowner

### この章でできるようになること

- 情報をcontext、retrieval、toolのどこで扱うか判断できる
- RAGを分割、検索、再rank、引用、access control、更新、evalまで設計できる
- tool description、structured output、schema、permissionを契約化できる
- logging、retry、timeout、partial failureを運用要件にできる
- fine-tuningをしない判断とsingle-agent / multi-agentの境界を説明できる

### 最短ルート

1. 「6.1 Context / retrieval / toolの選択」を使う
2. RAGなら「6.2」、外部作用なら「6.3」へ進む
3. 「6.5 Failure Contract」を必ず作る
4. [第8章](../chapter-08/)のcontrol matrixへ接続する

### 深掘りルート

6.1から6.8まで読み、Retrieval Spec、Tool Contract、Permission Matrix、Failure Contractを作成します。task evalの作り方は[第3章](../chapter-03/)、requestの構造は[第4章](../chapter-04/)を参照してください。

## 6.1 Context / retrieval / toolの選択

### 3つの役割

| 方法 | 適する情報・処理 | 主なrisk |
| --- | --- | --- |
| Contextへ直接入れる | 短く安定したpolicy、task固有input、少数の確定source | 過剰入力、版混在、機密送信 |
| Retrievalで取得する | 大量文書、頻繁に更新、質問ごとに必要範囲が変わるknowledge | 誤検索、古いindex、ACL漏れ、引用不整合 |
| Toolで取得・実行する | 現在値、計算、database、外部API、状態変更 | 権限過大、入力不正、partial write、外部依存 |

### Decision questions

1. **鮮度**: 回答時点の最新値が必要か
2. **量**: 全文を毎回渡せるか
3. **選択性**: 質問ごとに必要範囲が変わるか
4. **作用**: 読むだけか、外部状態を変えるか
5. **権限**: userごとに見える情報が違うか
6. **検証**: sourceや実行結果を追跡できるか
7. **失敗**: timeoutや欠落時に安全に止められるか

### 例

- coding standardの短い必須rule: 固定context
- 数千件の社内Runbook: retrieval
- 現在の在庫確認: read-only tool
- 発注登録: write tool + explicit approval
- 法令の適用判断: 一次source retrieval + 専門家review。modelだけで最終判断しない

## 6.2 RAGをsystemとして設計する

RAGは「vector検索結果をpromptへ入れる」だけではありません。sourceのingestionから回答の引用・評価までを含みます。

### Retrieval Spec

```text
Use case:
Authorized users:
Source systems:
Source owner:
Document version / effective date:
Chunking policy:
Metadata:
Index update SLA:
Query transformation:
Candidate retrieval:
Reranking:
Citation contract:
Access control:
Evaluation dataset:
Failure / no-answer behavior:
```

### Source ingestion

各documentに次のmetadataを付けます。

- source ID、owner、system of record
- title、document type、version、effective date
- confidentiality、tenant、group等のACL
- validity start/end、superseded by
- ingestion time、index version
- section、page、line等の引用位置

metadataがなければ、古い版や権限外documentを検索後に排除できません。

### 分割（chunking）

分割単位は固定文字数だけで決めず、意味と引用可能性を考えます。

| Document | 分割候補 | 注意 |
| --- | --- | --- |
| policy | 条項・subsection | 定義・例外・施行日を切り離さない |
| Runbook | 前提・step・rollback | commandと期待結果を同じunitにする |
| API spec | endpoint・schema・error | versionとauth requirementを含める |
| ticket | issue・comment・decision | 未確定commentと決定済み事項を区別する |

### 検索

keyword、embedding、filterを用途に応じて組み合わせます。

- exact ID、code、error message: keywordを重視
- 言い換え、自然言語質問: semantic retrievalを併用
- tenant、confidentiality、version、effective date: 検索前filter
- top-k: 固定値を一般化せず、evalで決める

### 再rank

first-stage retrievalの候補を、queryとの関連性、source authority、鮮度、ACL、document statusで並べ替えます。関連性だけで、古い版や非正本を上位にしないようにします。

### Citation contract

回答の各重要claimからsource位置へ追跡できるようにします。

```json
{
  "answer": "string",
  "claims": [
    {
      "claim": "string",
      "source_id": "POL-2026-04",
      "location": "section 3.2",
      "verified": true
    }
  ],
  "conflicts": [],
  "unanswered": []
}
```

citationの存在だけで正しさを判定しません。claimがsourceの意味と一致するか、sourceが対象versionかを検査します。

### アクセス制御（access control）

ACLはretrieval後のprompt instructionだけで守らせません。

- caller identityを認証する
- source systemまたはindexでauthorized filterを適用する
- document・chunkのmetadataへACLを保持する
- cache keyにtenant・permission contextを含める
- responseとlogで情報が混ざらないことをtestする
- 権限変更をindex・cacheへ反映する

### 更新性

次の時間を測ります。

- source更新からingestionまで
- ingestionからindex反映まで
- indexからcache失効まで
- superseded documentが検索対象外になるまで

「最新」と表示する場合は、この更新契約と回答時のsource versionを示します。

## 6.3 RAG Eval

### 評価層

| Layer | 指標例 | Failure例 |
| --- | --- | --- |
| Ingestion | 完全性、metadata、ACL、版 | page欠落、誤分類 |
| Retrieval | recall、precision、rank、slice | 正本を取得しない |
| Citation | claim coverage、location、entailment | citationはあるが主張を支えない |
| Answer | correctness、completeness、no-answer | 根拠外の補完 |
| Workflow | latency、cost、approval、audit | 権限外sourceがtraceに残る |

数値targetは一般書の例から転用せず、利用場面とfailure impactから決めます。

### Dataset slice

- 典型質問
- exact ID・error・code
- 複数sourceを統合する質問
- 版が競合する質問
- access禁止sourceを含む質問
- sourceに答えがない質問
- prompt injectionを含むdocument
- 更新直後・削除直後の質問

### No-answer

sourceに根拠がない場合は、もっともらしい補完より「回答不能」と確認手順を返します。

```text
結論: 現在のauthorized sourceでは確認できない。
検索範囲:
確認できた関連情報:
不足:
次の確認先:
```

## 6.4 Tool Contract

modelはtoolを提案・選択できますが、toolの実行責任はapplication側にあります。

### Tool description

良いdescriptionは次を含みます。

- 何をするtoolか
- 何をしないtoolか
- read / write / destructiveの区分
- 必要なpermissionとapproval
- inputの意味、単位、timezone、ID namespace
- outputとerrorの形式
- idempotencyとside effect

### Tool Contract template

```text
Tool ID / version:
Purpose:
Not for:
Trust level:
Read / write / destructive:
Required identity / permission:
Input schema:
Semantic validation:
Output schema:
Side effects:
Idempotency key:
Approval rule:
Timeout:
Retry:
Rate limit:
Logging:
Redaction:
Rollback / compensation:
Owner:
```

### Schema design

schemaは狭くします。

- free-form stringよりenum、typed ID、bounded numberを使う
- date/timeはformatとtimezoneを指定する
- monetary amountはcurrencyとminor unitを分ける
- target resourceをambiguous nameではなくstable IDで指定する
- optionalとrequiredを業務ruleに合わせる
- `additionalProperties`の扱いを決める

### Semantic validation

schemaに適合しても、次を確認します。

- callerが対象resourceへ権限を持つか
- order quantityやamountがpolicy内か
- resource stateが操作可能か
- duplicate / replayでないか
- instructionの目的とtool actionが一致するか
- human approvalが対象actionとparameterを確認したか

### structured output

structured outputは、model出力を後続systemが安全にparseするための一部です。次を分けます。

1. JSON/schema validation
2. business rule validation
3. authorization
4. effect execution
5. result verification

modelが返した`approved: true`をapprovalとして扱いません。

## 6.5 Permission・approval・trust boundary

### Permission Matrix

| Tool | Read | Write | Approval | Data class | Owner |
| --- | --- | --- | --- | --- | --- |
| search_policy | allowed | n/a | 不要 | internal | knowledge owner |
| draft_ticket | allowed | draftのみ | 作成前review | internal | support lead |
| update_order | lookup | allowed | parameter表示後に必須 | confidential | operations owner |
| delete_record | metadataのみ | 原則禁止 | emergency procedure | restricted | data owner |

### Least privilege

- taskごとの短命credential
- resource・operation・environmentを限定
- productionとstagingを分離
- read toolとwrite toolを分離
- high-risk parameterへ追加approval
- tool responseに不要なsecretを含めない

### Human approval UI / record

approverへ次を表示します。

- 実行するtoolとversion
- target resource
- parameter
- expected effect
- sourceとなったuser request
- risk、rollback、期限

「実行してよいですか」だけでは、内容を確認したapprovalになりません。

## 6.6 Failure Contract

### timeout

- connect、read、overallを必要に応じて分ける
- timeout後にserver-side actionが継続する可能性を考える
- write toolはstatus確認なしに再実行しない
- userへpartial / unknown stateを伝える

### retry

retry可能なのは、temporary failureで、idempotencyまたは重複防止が保証される場合です。

- exponential backoffとjitter
- 最大回数・総時間
- retry対象errorのallowlist
- rate limit headerやprovider guidance
- retry後も失敗したときのescalation

### partial failure

複数stepの途中で失敗した場合に備えます。

```text
Completed steps:
Unknown state:
Unapplied steps:
Compensation:
Manual verification:
Resume token / condition:
```

### logging

最低限、次をcorrelation IDで追跡します。

- caller / agent / workflow version
- tool ID / version
- parameterのmask済みsummary
- approval record
- start/end/status/error category
- effect verification
- retry / timeout / compensation

prompt全文、secret、個人情報を無条件にloggingしません。保持・access・削除は[第8章](../chapter-08/)で定義します。

## 6.7 MCPを使うときの設計

MCPはclientとserverがcapabilityを共有するprotocolです。interoperabilityを助けますが、接続先の信頼性、authorization、data governanceを自動保証しません。

### MCP接続review

- serverのowner、distribution、version、update経路
- transport、authentication、authorization
- 提供するtools/resources/prompts
- tool descriptionとinput schema
- local / remote trust boundary
- access可能なfilesystem、network、data
- logging、consent、approval
- server停止・version drift時の挙動

### Capability allowlist

client側で、使用するserver・tool・resourceをtaskごとに限定します。serverが新しいtoolを追加しても、自動的にproduction権限を付与しません。

### Tool resultを再評価する

MCP tool resultも外部contentです。result内の命令文を上位instructionとして扱わず、schema、source、authorization、business ruleを確認します。

## 6.8 Fine-tuning / multi-agentの境界

### Fine-tuningより先に確認する

1. requestとoutput contractは明確か
2. 必要なknowledgeをcontext/retrievalで供給できるか
3. toolで決定的に処理すべき部分ではないか
4. eval datasetとgraderがあるか
5. model/prompt変更で解けない一貫したbehavior要件か
6. training dataの権利・privacy・代表性を確認したか
7. 更新・rollback・monitoringの運用を持てるか

最新knowledgeの注入、権限管理、事実確認をfine-tuningだけで解決しません。

### Single-agentを優先する条件

- 一つのcontextとownerで完結する
- tool数と権限が限定される
- stepごとのdeterministic checkを置ける
- latencyとcostを抑えたい
- agent間のconflict解決が不要

### Multi-agentを検討する条件

- 明確に異なるownership・permission・contextがある
- 独立した成果物を並行作成できる
- verifierを実行者から分離する価値がある
- handoff schemaとconflict resolutionが定義できる
- trace、cost、failureの増加をevalできる

agent数を増やすことは品質保証ではありません。role overlap、feedback loop、共有memory、credential propagationが新たなriskになります。

## 実践例：社内knowledge問い合わせ

### Requirement

従業員が旅費規程を質問し、根拠条項を確認できる。個別の法務・人事判断は担当者へescalateする。

### Design

- context: 回答policy、出力contract、禁止事項
- retrieval: 有効な規程・FAQ。旧版は検索対象外だがaudit用に保持
- filter: userの所属・権限・effective date
- rerank: 正本、条項一致、鮮度
- output: 結論、根拠条項、適用条件、要確認点
- tool: 人事ticketのdraft作成。送信は人間承認

### Negative cases

- 未公開の人事資料を要求する
- 旧版規程を「最新」とする
- document内に外部送信を促すinstructionがある
- 根拠条項がないのに断定する
- 他社員の個人情報を含む回答を生成する

### Acceptance

- authorized sourceだけを取得する
- 重要claimが条項へ追跡できる
- 答えがないときはno-answerになる
- ticket送信前にtargetと本文を表示し承認を得る
- logに質問全文や個人情報を不要に残さない

## 章末まとめ

- context、retrieval、toolは鮮度、量、作用、権限、検証で使い分ける
- RAGはingestion、chunking、search、rerank、citation、ACL、更新、evalを含むsystemである
- tool callはschema適合後もsemantic validation、authorization、approvalが必要である
- timeout、retry、partial failure、loggingを実行前に契約化する
- MCP準拠は接続先の安全性を保証しない
- fine-tuningとmulti-agentは、request・retrieval・tool・evalを整えた後に採否を判断する

## 実務チェックリスト

- [ ] context / retrieval / toolの選択理由がある
- [ ] source owner、version、effective date、ACLをmetadataへ持つ
- [ ] chunkとcitationが元sourceへ追跡できる
- [ ] 権限禁止・no-answer・版競合をevalする
- [ ] tool description、input/output schema、side effectが明確である
- [ ] schema validation、business rule、authorization、approvalを分離した
- [ ] timeout、retry、idempotency、partial failure、rollbackを定義した
- [ ] loggingのmask、保持、access、削除方針へ接続した
- [ ] MCP server/toolをallowlistし、version driftを監視する
- [ ] fine-tuning / multi-agentを採用しない選択肢を比較した

## 次に読む章・参照付録

- 組織へ導入する: [第7章](../chapter-07/)
- quality・security・audit controlを設計する: [第8章](../chapter-08/)
- Tool ContractとEval Specを使う: [付録A](../../appendices/appendix-a/)
- 最新specを再確認する: [付録B](../../appendices/appendix-b/)、[付録E](../../appendices/appendix-e/)

## Source Notes

- [OAI-TOOLS](../../appendices/appendix-b/#oai-tools): tool useとfunction calling
- [OAI-STRUCTURED](../../appendices/appendix-b/#oai-structured): structured output
- [ANT-TOOLS](../../appendices/appendix-b/#ant-tools): tool descriptionとschema
- [GGL-STRUCTURED](../../appendices/appendix-b/#ggl-structured)、[GGL-FUNCTION](../../appendices/appendix-b/#ggl-function)、[GGL-TOOLS](../../appendices/appendix-b/#ggl-tools): structured outputとtool use
- [MCP-SPEC](../../appendices/appendix-b/#mcp-spec)、[MCP-TOOLS](../../appendices/appendix-b/#mcp-tools): MCP revision 2025-11-25
- [RESEARCH-RAG](../../appendices/appendix-b/#research-rag): RAGの原著
- [OWASP-LLM-2025](../../appendices/appendix-b/#owasp-llm-2025)、[OWASP-AGENTIC-MITIGATIONS](../../appendices/appendix-b/#owasp-agentic-mitigations): injectionとagentic control
- 対象version/status、確認日、再確認条件は付録Bに記録。最終確認: 2026-07-21
