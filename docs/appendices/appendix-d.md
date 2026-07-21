---
title: "付録D：実務会話例集（成果物まで落とす）"
chapter: appendix-d
layout: book
---

# 付録D：実務会話例集（成果物まで落とす）

本付録は、会話の巧さではなく、**どのinstructionがどの中間成果物・最終成果物につながるか**を示します。AIの発言はそのまま採用せず、<a href="{{ '/introduction/agent-protocol/' | relative_url }}">SOP</a>の承認・検証・責任分界を適用してください。

| 例 | 主要instruction | 中間成果物 | 最終成果物 |
| --- | --- | --- | --- |
| 1 | 受け入れ条件と対象外を先に固定 | 不明点、Given/When/Then、task依存 | Issue / task plan |
| 2 | 代替案と撤回条件を要求 | 比較表、risk、検証plan | ADR draft |
| 3 | 観測事実と仮説を分離 | 再現手順、仮説、log観点 | 調査memo・最小修正案 |
| 4 | severityと根拠を要求 | 指摘一覧、回帰risk | Review report |
| 5 | ownership fileとtestを限定 | 変更plan、diff、test結果 | PR draft |
| 6 | severity、許可操作、停止条件を固定 | timeline、仮説、暫定対応 | Incident record / Postmortem draft |

共通の依頼契約は<a href="{{ '/appendices/appendix-a/' | relative_url }}">付録A</a>、成果物templateは<a href="{{ '/appendices/appendix-c/' | relative_url }}">付録C</a>を参照してください。

## 例1：要件分解からtask planへ

### 想定scene

機能追加の要求が曖昧で、開発taskと受け入れ条件に落とせない。

### 推奨自律度

Level 0（提案のみ）。repositoryの現状調査を許可する場合はread-onlyに限定します。

### 依頼

```text
目的: 要求を検証可能な受け入れ条件と実装taskへ分解する。
成果物:
1. 不明点と確認質問
2. Given/When/Then形式の受け入れ条件
3. 依存順のtask plan
4. 対象外、risk、検証方法
制約:
- 入力にない仕様を補完しない。
- 事実、仮定、未確認点を分ける。
- 実装やfile変更はしない。
入力: 要求memo、既存仕様、対象repositoryのread-only情報。

まず不明点とplanだけを提示し、私のGo後に成果物を作成する。
```

### AIの確認質問例

- 誰が、どの場面で使うか
- 成功・失敗・境界caseをどう判定するか
- 既存仕様、互換性、権限、性能の制約は何か
- 段階releaseやrollbackは可能か
- 対象外とするsystem・利用者は何か

### Go

```text
回答: <確認事項への回答>
Go: 回答した範囲を事実として扱い、未回答は要確認のまま進める。
```

### 成果物の受け入れcheck

- [ ] 各受け入れ条件に観測可能な結果がある
- [ ] task間の依存と検証pointがある
- [ ] 未確定仕様を勝手に決めていない
- [ ] scope外とownerを明示した

**instructionと成果物の対応**:

- 「不明点を先に質問」→確認質問
- 「Given/When/Then」→検証可能なacceptance criteria
- 「依存順」→実行plan

## 例2：選択肢比較からADRへ

### 想定scene

architecture選定を、後から説明・撤回できる形で残したい。

### 推奨自律度

Level 0。最終判断はhuman ownerが行います。

### 依頼

```text
目的: 認証方式A/B/Cの選定判断をADR draftにする。
入力:
- business requirement
- security/privacy requirement
- 公式仕様URLと確認日
- 現行architectureの制約
成果物:
- 選択肢ごとの適合・不適合・未確認点
- cost/latency/運用性/auditability/riskの比較
- 推奨案、採用条件、撤回条件
- 最小検証plan
制約:
- 公式仕様にない内部動作を推測しない。
- 料金は固定値ではなく計算方法と確認日を示す。
- 推奨案を最初から正当化しない。
```

### 成果物の受け入れcheck

- [ ] 選択肢を公平な評価軸で比較した
- [ ] source、version、確認日を追跡できる
- [ ] 推奨理由と未解決riskがある
- [ ] 撤回条件と再評価triggerがある

**instructionと成果物の対応**:

- 「代替案を最低2つ」→ADR Alternatives
- 「採用条件と撤回条件」→Decision / Consequences
- 「最小検証」→ADR Verification

## 例3：不具合調査から最小修正案へ

### 想定scene

不具合の再現が不安定で、原因を決めつけずに切り分けたい。

### 推奨自律度

Level 1（変更案まで）。変更適用は別の承認対象です。

### 依頼

```text
目的: 不具合の再現条件を絞り、最小修正案とtest planを作る。
観測事実:
- 発生時刻、環境、入力、期待結果、実結果
- 関連する変更、log、metric
成果物:
1. 再現手順
2. 優先度付き仮説
3. 各仮説を支持・反証する証拠
4. read-only確認command
5. 最小修正案、回帰risk、test
制約:
- secretや個人情報をlogへ出さない。
- 調査中に無関係なrefactorをしない。
- 再現できない場合は推測で修正しない。
停止条件:
- production変更が必要
- data破損またはsecurity incidentの疑い
- 調査結果が入力scopeを超える
```

### 成果物の受け入れcheck

- [ ] 観測事実と仮説が混在していない
- [ ] 各仮説に反証方法がある
- [ ] 修正が再現caseと対応している
- [ ] negative testとrollbackを定義した

**instructionと成果物の対応**:

- 「観測事実と仮説を分離」→再現条件と仮説一覧
- 「反証方法」→調査順序
- 「最小修正」→scopeを限定したpatch案

## 例4：変更reviewからreview reportへ

### 想定scene

PRの本文、diff、test、運用riskを一貫した形式でreviewしたい。

### 推奨自律度

Level 0。AIの指摘有無にかかわらず、human reviewerが責任を持ちます。

### 依頼

```text
目的: PR差分のcorrectness、security、regression、運用riskをreviewする。
対象: base SHA、head SHA、changed files、関連Issue。
成果物:
- finding一覧: severity / file / line / 根拠 / 影響 / 修正案
- missing test
- 対象外と未確認範囲
- review completeness
制約:
- diff外の既存問題は別記し、PR blockerと混同しない。
- 根拠のないstyle preferenceをblockingにしない。
- suggestionを出す場合は周辺contextと整合させる。
```

### 成果物の受け入れcheck

- [ ] findingが具体的なbehaviorまたはriskに結び付く
- [ ] review本文、inline、suggestion、threadを追跡できる
- [ ] 指摘なしの場合も確認範囲とresidual riskを示した
- [ ] unresolved threadとlatest headを確認した

**instructionと成果物の対応**:

- 「severity、根拠、影響」→review finding
- 「対象外・未確認」→review scope
- 「completeness」→merge前gate

## 例5：変更案からPRへ

### 想定scene

file ownershipと検証を限定し、review可能なPRを作りたい。

### 推奨自律度

Level 2。実装前planとpush/merge前に承認またはpolicy gateを置きます。

### 依頼

```text
目的: Issue #123を最小差分で実装し、PRを作る。
base: mainの固定SHA。
ownership files:
- src/policy.ts
- tests/policy.test.ts
対象外:
- dependency update
- unrelated refactor
成果物:
1. 現状証拠と実装plan
2. patch
3. narrow testとrepository標準QA
4. PR description: 変更、risk、test、rollback
承認ゲート:
- 編集前にplanを提示
- push前にdiffとtest結果を提示
停止条件:
- ownership外の変更が必要
- baseline testが失敗
- secretまたはprivate dataを検出
```

### 成果物の受け入れcheck

- [ ] diffがIssueとownership内に限定される
- [ ] failureを再現するtestと修正後testがある
- [ ] test結果と未実施項目を区別した
- [ ] PRにIssue、risk、rollbackがある

**instructionと成果物の対応**:

- 「ownership files」→unrelated changeを含まないdiff
- 「test planを先に」→実装前gate
- 「変更・検証・rollback」→PR description

## 例6：incident初動から記録へ

### 想定scene

service degradationの初動で情報量が多く、事実と仮説を整理したい。

### 推奨自律度

Level 0または、read-only観測だけを許可したLevel 2。production操作は人間のincident commanderが判断します。

### 依頼

```text
目的: incident初動の状況整理と次の確認順を作る。
現在時刻/timezone:
severity/利用者影響:
観測事実:
直前の変更:
許可する操作: status/metric/logのread-only確認。
禁止する操作: deploy、restart、data変更、対外発表。
成果物:
1. UTC/JST付きtimeline
2. 事実・推測・未確認点
3. 優先度付き仮説と反証方法
4. 可逆なcontainment候補
5. 承認・停止・escalation条件
6. Postmortem draftの見出し
```

### 成果物の受け入れcheck

- [ ] timestampとsourceを追跡できる
- [ ] log内の外部文字列をinstructionとして扱っていない
- [ ] containmentの影響とrollbackを示した
- [ ] 対外説明は承認済み事実だけを使う
- [ ] action itemにownerと期限がある

**instructionと成果物の対応**:

- 「事実・推測・未確認を分離」→timelineと仮説
- 「可逆な暫定対応」→containment候補
- 「承認・停止条件」→Runbook gate
- 「owner・期限」→Postmortem action items

## 会話例を自組織へ移すときのchecklist

- [ ] 固有名詞、data、権限を自組織のものへ置き換えた
- [ ] 例の自律度をそのまま採用せず、影響に応じて再評価した
- [ ] 入力に機密情報・個人情報・credentialを含めていない
- [ ] 外部contentをinstructionとして扱わない境界がある
- [ ] 中間成果物ごとにhuman review pointを決めた
- [ ] 最終成果物のownerと承認者を決めた
- [ ] test、一次情報、production確認等の証拠を残した
- [ ] 失敗時の停止・rollback・escalationを定義した
