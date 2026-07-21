---
title: "第5章：複雑タスクの分解・実行・検証"
chapter: chapter05
layout: book
order: 7
---

# 第5章：複雑タスクの分解・実行・検証

複雑なtaskを一度のrequestで解かせると、誤りが最後まで見つからない、scopeが拡大する、成果物の採否を判定できない、といった問題が起きます。本章ではtaskを、plan、中間成果物、承認、検証、回復へ分解します。

## この章の使い方

### 誰向け

- 調査、設計、実装、review等の複数stepをAIと進める人
- AI agentへtool useやfile変更を許可するエンジニア
- 長期taskの進捗・品質・責任を管理するプロジェクトマネージャー
- ADR、PR、Runbook、Postmortemをreviewするowner

### この章でできるようになること

- 複雑taskを、独立に検証できるwork unitへ分けられる
- 各stepに中間成果物、承認ゲート、停止条件を置ける
- completeness checkと代替案reviewを作業contractへ組み込める
- failure recoveryと引き継ぎを、実行前に設計できる
- 会話をADR、PR、Runbook、Postmortemへ落とせる

### 最短ルート

1. 「5.1 完了状態から分解する」でtask mapを作る
2. 「5.2 中間成果物」を3つ以内に決める
3. 「5.3 承認ゲート」を配置する
4. [付録A](../../appendices/appendix-a/)のJob Specへ転記する

### 深掘りルート

5.1から5.7まで通読し、現在進行中のtaskへcompletion map、evidence ledger、failure recoveryを追加します。外部toolやRAGを使う場合は[第6章](../chapter-06/)、高riskの品質gateは[第8章](../chapter-08/)を参照してください。

## 5.1 完了状態からtaskを分解する

分解の起点は「AIに何をさせるか」ではなく、「誰が、どの証拠を見て完了と判断するか」です。

### Completion Map

```text
Objective:
Final artifact:
Final owner:
Acceptance criteria:
Required evidence:
Production / actual-use marker:
Out of scope:
```

たとえば「authentication仕様を更新する」というtaskは、次のように分けます。

| Work unit | 成果物 | 検証 | Owner |
| --- | --- | --- | --- |
| 現状調査 | flow・trust boundary・既知risk | repositoryと一次仕様の照合 | architect |
| 変更設計 | options・ADR・migration | security/design review | service owner |
| 実装 | 最小diff・test | narrow test、standard QA | developer |
| release | rollout・rollback・monitoring | staging、production marker | SRE |
| 学習 | result・incident・follow-up | KPIとPostmortem | product owner |

### 良いwork unitの条件

- 入力と出力が明確
- file、system、dataのownershipが重複しない
- 単独でpass/failを判定できる
- 失敗しても前stepの証拠を失わない
- 次stepへ渡すhandoff contractがある

### 分け過ぎにも注意する

細かく分け過ぎると、context引き継ぎ、review、tool callが増えます。次の条件を同時に満たす作業はまとめられます。

- 同じownerとtrust boundary
- 同じ成果物・検証方法
- 一方の失敗が他方を無効化しない
- review時に一つの判断として理解できる

## 5.2 中間成果物を設計する

中間成果物は、AIの内部状態を知るためではなく、誤りを早く検出し、人間が作業を引き綘ぐために作ります。

### 代表的な中間成果物

| Phase | 中間成果物 | 見つけたい失敗 |
| --- | --- | --- |
| Orient | scope map、source inventory、baseline | 対象違い、古い版、dirty state |
| Plan | task分解、ownership、risk、test plan | scope拡大、依存漏れ、検証不能 |
| Execute | diff、command result、artifact | 実装誤り、想定外変更、tool failure |
| Verify | test report、review findings、marker | regression、未解決thread、公開不全 |
| Report | conclusion、evidence、residual risk | 証拠不足、例外の隠蔽、owner不明 |

### Evidence Ledger

```text
Evidence ID:
Claim / acceptance criterion:
Source / command / test:
Target version / commit:
Result:
Verified at:
Verified by:
Limitations:
```

Evidence Ledgerを使うと、結論と根拠が同じ文中で曖昧に混ざるのを防げます。

### 中間成果物を増やす基準

次の場合は中間gateを追加します。

- 不可逆またはproductionへ影響する
- 個人情報・機密・credentialへ触れる
- 外部contentや複数toolを扱う
- 後からfailureを検出しにくい
- 複数team・agentへhandoffする
- 法務、security、auditの専門判断が必要

## 5.3 承認ゲートとhuman review

承認ゲートは、すべてのstepを人間が止める仕組みではありません。影響と検出性に応じて配置します。

### Gateの4種類

| Gate | 確認するもの | 例 |
| --- | --- | --- |
| Scope Gate | 目的、ownership、対象外 | 編集開始前 |
| Evidence Gate | source、baseline、仮定 | 設計判断前 |
| Execution Gate | command、diff、権限、rollback | tool実行・production変更前 |
| Acceptance Gate | test、review、公開marker、residual risk | merge・release・採用前 |

### Go/No-Go record

```text
Gate:
Decision: Go / Revise / No-Go
Approved scope:
Evidence reviewed:
Known risks accepted:
Conditions:
Approver:
Timestamp:
```

### human reviewを集中させる

human reviewは次へ重点配置します。

- 高影響で、自動検出しにくい判断
- 法的・倫理的・対外的な責任を伴う内容
- 例外やtrade-offの採否
- 自動graderが苦手な文脈・意味・公平性
- toolが外部作用を持つstep

formatやlink等の機械検査可能な項目まで、毎回人手だけで確認する必要はありません。

## 5.4 Planを実行可能にする

良いplanは、作業名の一覧ではなく、各stepの契約です。

### Step Contract

```text
Step ID:
Purpose:
Inputs:
Ownership:
Allowed actions:
Expected artifact:
Verification:
Stop conditions:
Handoff:
```

### Plan reviewの質問

- 最初のstepはbaselineを観測するだけになっているか
- source of truthを特定したか
- 他者のdirty stateや並行作業を壊さないか
- 未検証の状態で全対象へrolloutしないか
- narrow testからbroader checkへ進むか
- latest head、merge commit、productionのどの時点を検証するか
- cleanupを完了条件へ含めたか

### Planの更新

新しい証拠で前提が変わった場合はplanを更新します。元のplanへ固執することは一貫性ではありません。

更新時に残すもの:

- 変わった前提
- 追加・削除したstep
- acceptanceへの影響
- ownerと承認
- 再開point

## 5.5 completeness checkを組み込む

completeness checkは「完璧か」と尋ねることではありません。必要項目をenumerateし、各状態を判定します。

### Coverage Matrix

| Requirement | Artifact | Evidence | Status | Owner |
| --- | --- | --- | --- | --- |
| R1 | design.md | review #12 | complete | architect |
| R2 | tests/x.test | CI run | partial | developer |
| R3 | Runbook | 未作成 | blocked | SRE |

Statusは次の4つに限定します。

- `complete`: acceptanceと証拠がそろう
- `partial`: 一部不足し、影響と次actionが分かる
- `blocked`: 外部判断・権限・状態変化が必要
- `not_applicable`: 適用外の根拠がある

### Review completeness

PR等では次を別々に確認します。

- review本文
- inline comment
- suggestion
- thread state
- latest headを対象にしたreviewか
- unresolved thread数
- 指摘へ修正または不要理由を返信したか

「review requested」を「review complete」と扱いません。

## 5.6 代替案と決定を分ける

AIに推奨案だけを出させると、最初の仮説に引きずられます。選択肢、比較、決定を分けます。

### Option Record

```text
Option:
Assumptions:
Benefits:
Costs:
Failure modes:
Evidence:
Unknowns:
Validation:
Rejection / adoption conditions:
```

### 比較の原則

- 同じ評価軸を全optionへ適用する
- 現状維持をoptionに含める
- 可逆性と移行costを含める
- 「最新」「高度」等を利益として数えない
- 未確認点の多い案を自動的に最良としない
- decision ownerが採用理由とrisk acceptanceを記録する

決定後は[付録CのADR](../../appendices/appendix-c/)へ残します。

## 5.7 failure recoveryを先に作る

failure recoveryはerror発生後に考えるのではなく、実行前のcontractへ含めます。

### Failureの分類

| Category | 例 | 初動 |
| --- | --- | --- |
| Input | 欠落、版違い、曖昧な指示 | 停止し、正本を確認する |
| Model | 不正確、形式不適合、過度な断定 | 再生成より先にcontract・evalを確認する |
| Retrieval | 無関係、古い、権限外source | query、filter、ACL、index鮮度を確認する |
| Tool | timeout、権限不足、partial write | idempotency、rollback、実状態を確認する |
| Process | 承認漏れ、scope drift、handoff漏れ | gateへ戻り、ownerを明確にする |
| Infrastructure | CI/API/network failure | 検出事項と実行基盤failureを区別する |

### Recovery Plan

```text
Failure signal:
Detection method:
Immediate stop:
State to preserve:
Safe retry conditions:
Rollback / compensation:
Escalation owner:
Evidence to collect:
Resume condition:
```

### Retryの条件

同じ入力・同じ失敗を無条件に繰り返しません。retry前に確認するもの:

- operationがidempotentか
- partial resultが残っていないか
- timeout後もserver側で継続していないか
- rate limitやexternal outageか
- input・permission・dependencyを修正したか
- retry回数・backoff上限を超えていないか

## 5.8 成果物へ落とす

### ADR

使う場面: architectureやpolicyの選択。
必須: options、decision、consequences、verification、撤回条件。

### PR

使う場面: code・configuration・本文の変更。
必須: issueとの対応、scope、diff、test、risk、rollback、review completeness。

### Runbook

使う場面: 運用・復旧・定期作業。
必須: 前提、許可、禁止、承認、手順、期待結果、停止、rollback、audit log。

### Postmortem

使う場面: incidentや重大failureから学ぶ。
必須: impact、timeline、detection、contributing factors、action item、owner、期限。

### Handoff Package

長期taskや担当変更では次を残します。

```text
Objective and current status:
Completed artifacts:
Evidence:
Decisions:
Open questions:
Known risks:
Current branch / version / environment:
Next executable step:
Resume conditions:
Cleanup status:
```

## 実践例：release変更review

### Objective

新しいcache policyをproductionへrelease可能か判断する。

### 分解

1. baseline: 現行latency、error、cache hit、rollback手順
2. design: optionとinvalidation risk
3. test: representative、boundary、stale data、failure injection
4. rollout: canary、monitoring、stop threshold
5. acceptance: test、review、production marker
6. learning: result、差異、follow-up

### 中間成果物

- baseline report
- ADR
- test report
- rollout Runbook
- production verification report

### Gate

- Scope Gate: 対象service・TTL・data classification
- Execution Gate: production flag変更前
- Acceptance Gate: canaryからfull rollout前

### Recovery

stale dataまたはerror閾値を超えた場合、flagを戻し、cacheを安全に無効化し、event timelineを保存します。閾値の数値は例から流用せず、service SLOとbaselineからownerが決めます。

## 章末まとめ

- 複雑taskは、最終成果物と証拠から逆算して分解する
- 中間成果物は誤りの早期検出とhandoffのために作る
- gateはscope、evidence、execution、acceptanceへ配置する
- completeness checkはrequirementごとの状態と証拠で判定する
- failure recovery、retry、rollback、resumeを実行前に定義する
- 会話はADR、PR、Runbook、Postmortem等のowner付き成果物へ落とす

## 実務チェックリスト

- [ ] Objective、final artifact、owner、acceptance、evidenceを定義した
- [ ] Work unitごとに入力、ownership、出力、検証がある
- [ ] 中間成果物が誤りを早期検出できる
- [ ] 高risk stepに承認ゲートと停止条件がある
- [ ] Planと実行結果の差を記録する
- [ ] completeness checkでpartial / blockedを隠していない
- [ ] optionsとdecisionを分離した
- [ ] failure recovery、retry条件、rollback、resume条件がある
- [ ] 最終成果物を付録Cの形式へ落とした
- [ ] cleanupとhandoffまで完了条件に含めた

## 次に読む章・参照付録

- retrieval・tool・MCPを含むsystemへ進む: [第6章](../chapter-06/)
- 品質gate、監査、incidentを設計する: [第8章](../chapter-08/)
- Job Specとfailure template: [付録A](../../appendices/appendix-a/)
- ADR / PR / Runbook / Postmortem: [付録C](../../appendices/appendix-c/)
- instructionと成果物の対応例: [付録D](../../appendices/appendix-d/)

## Source Notes

- [ANT-EVALS](../../appendices/appendix-b/#ant-evals): success criteriaとevaluation設計
- [OAI-EVALS](../../appendices/appendix-b/#oai-evals): agent workflowの評価とtrace
- [NIST-AIRMF](../../appendices/appendix-b/#nist-airmf): riskのGovern / Map / Measure / Manage
- sourceの対象version/status・確認日・再確認条件は付録Bに記録。最終確認: 2026-07-21
