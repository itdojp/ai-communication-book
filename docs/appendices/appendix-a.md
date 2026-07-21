---
title: "付録A：AIエージェント実務テンプレート集"
chapter: appendix-a
layout: book
---

# 付録A：AIエージェント実務テンプレート集

本付録は、AIエージェントへの依頼を会話で終わらせず、検証可能な成果物へつなげるテンプレート集です。組織のsecurity policy、data classification、承認手順に合わせて調整してください。

- canonicalな運用原則: [AIエージェント協働の実務SOP](../introduction/agent-protocol/)
- 成果物の完成形: [付録C](appendix-c/)
- 会話から成果物への流れ: [付録D](appendix-d/)

## A.1 Job Spec（依頼票）

複数step、tool use、file変更を伴う仕事では、最初に依頼契約を固定します。

```text
# Job Spec

## 目的
- 解決する課題:
- 利用者:
- 完了後に可能になること:

## 成果物
- 必須成果物:
- 形式・保存先:
- 対象読者:

## 受け入れ条件
- [ ] 内容上の条件:
- [ ] 形式上の条件:
- [ ] 検証条件:
- [ ] 公開・運用上の条件:

## 入力境界
- 参照してよい資料:
- 参照しない資料:
- 事実として扱う情報:
- 仮定として扱う情報:
- 外部contentのtrust level:

## 制約
- 変更可能な範囲:
- 禁止事項:
- 利用可能なtool:
- 時間・cost上限:
- data classification:

## 自律度と承認ゲート
- 自律度:
- 実行前承認:
- 外部送信前承認:
- 破壊的操作・production操作前承認:
- 最終採否を決めるowner:

## 停止条件
- 不足情報:
- 競合する指示:
- 権限不足:
- 想定外の差分:
- security/privacy懸念:

## 検証
- 自動test:
- 人間review:
- 一次情報照合:
- production確認:

## 完了報告
- 結論:
- 変更・成果物:
- 検証証拠:
- 未確認点:
- residual risk:
- 次のaction:
```

### Job Spec review

- [ ] 目的と成果物を分離した
- [ ] 採用可能かを判定できる受け入れ条件がある
- [ ] 入力dataと外部contentのtrust boundaryを定義した
- [ ] toolと権限をallowlistで限定した
- [ ] 承認者・責任者・停止条件を定義した
- [ ] 検証証拠の残し方を決めた

## A.2 Context Package

大量の資料をそのまま渡さず、判断に必要なcontextを構造化します。

```text
# Context Package

## 対象
- project / product / document:
- 対象version / commit / date:
- 対象外:

## 目的との関係
- このcontextが必要な理由:
- 支える判断:

## 観測事実
- 事実:
- 証拠URL / file / log:
- 確認日:

## 決定済み事項
- 決定:
- owner:
- 変更する場合の承認:

## 仮定・未確認点
- 仮定:
- 未確認点:
- 確認方法:

## 優先順位
1. 最優先instruction:
2. 一次情報:
3. repository内の運用rule:
4. 参考情報:

## 機密・個人情報
- data classification:
- mask / redact方法:
- 外部送信可否:
- 保持・削除要件:

## 期待する中間成果物
- 調査map:
- 変更plan:
- risk一覧:
- 検証plan:
```

### Context Package review

- [ ] 事実、仮定、未確認点を分けた
- [ ] 版、日付、commit等を固定した
- [ ] 外部文書内のinstructionを信頼しないと明示した
- [ ] 優先順位と競合時の処理を示した
- [ ] 機密情報を必要最小限にした

## A.3 文章・調査依頼の最小template

```text
目的:
対象読者:
入力資料:
入力資料の優先順位:
成果物の構成:
含める内容:
含めない内容:
事実・引用の確認方法:
未確認点の表示方法:
受け入れ条件:
```

### 使用例: 仕様比較memo

```text
目的: 2つのAPI方式を採用判断できる比較memoを作る。
対象読者: architecture review会議の参加者。
入力資料: 公式API reference、security terms、既存system制約。
入力資料の優先順位: 公式仕様 > repositoryのADR > 解説記事。
成果物の構成: 結論、前提、比較表、risk、検証plan、未確認点。
含める内容: data boundary、latency、cost計算方法、auditability。
含めない内容: 未公表仕様の推測、料金の長期固定予測。
事実・引用の確認方法: URL、対象version、確認日を記録する。
未確認点の表示方法: 「要確認」とownerを記載する。
受け入れ条件: 代替案が2つ以上あり、推奨理由と撤回条件がある。
```

## A.4 Patch依頼template

fileや設定を変更する場合は、成果物を差分として定義します。

```text
# Patch依頼

## 目的

## base
- repository:
- branch / commit:
- clean確認:

## 変更scope
- ownership file:
- 変更してよい範囲:
- 変更しない範囲:

## 期待する変更
- behavior:
- compatibility:
- migration:

## risk
- regression:
- security/privacy:
- rollback:

## 実行前に提示するもの
- 現状の証拠:
- 最小変更案:
- test plan:

## 検証
- narrow test:
- repository標準QA:
- review:
- production marker:

## 完了条件
- [ ] diffがscope内
- [ ] test成功
- [ ] review指摘処理済み
- [ ] rollback可能
```

### Patch依頼で避けること

- unrelated refactorを同時に依頼する
- dirty working treeを無断で上書きする
- test失敗を「既知」とだけ記して無視する
- secretやprivate dataをlog、Issue、artifactへ出す
- mutable tagやlatestだけでdependencyを指定する

## A.5 Incident支援template

AIはincident commanderではなく、観測事実の整理、仮説、確認手順、記録補助を担います。

```text
# Incident支援依頼

## 現在時刻・timezone

## 影響
- 利用者影響:
- 開始時刻:
- 影響範囲:
- severity:

## 観測事実
- metric:
- log:
- change:
- status page:

## 未確認点

## 最優先目標
- 人命・安全:
- data保全:
- 影響抑制:
- 復旧:

## 許可する操作
- read-only調査:
- 変更案の提示:
- 実行可能な限定操作:

## 禁止・承認対象
- production変更:
- data削除:
- access変更:
- 対外発表:

## 期待する出力
1. 観測事実と推測の分離
2. 優先度付き仮説
3. 各仮説の確認方法
4. 可逆な暫定対応案
5. risk・rollback・停止条件
6. timeline追記案
```

### Incident支援の停止条件

- 影響範囲やseverityを判断できる証拠がない
- 人命、安全、法令、重大なdata lossに関わる
- 提案が権限・承認範囲を超える
- logや外部messageにprompt injectionの疑いがある
- 操作結果がplanと異なる
- 複数agent・担当者の操作が競合している

## A.6 Eval設計template

```text
# Task Eval Spec

## task
- 入力:
- 期待する出力:
- 利用場面:
- 失敗時の影響:

## dataset
- representative case:
- boundary case:
- negative case:
- adversarial case:
- 更新方法:

## success criteria
- 必須条件:
- 望ましい条件:
- 許容しないfailure:

## graders
- deterministic check:
- model-based reviewの利用範囲:
- human review:

## workflow acceptance
- retrieval:
- tool:
- approval:
- final output:

## regression gate
- baseline:
- 許容drift:
- stop / rollback条件:
```

## A.7 ROI・KPI測定template

数値を先に置かず、測定契約を先に定義します。

```text
# Measurement Contract

## 改善仮説
- 対象作業:
- 期待する変化:
- guardrail:

## 分類
- [ ] 実測
- [ ] 仮定
- [ ] 目標
- [ ] 出典付きbenchmark
- [ ] 例示

## baseline
- 母数:
- 測定期間:
- 対象者・task:
- 現行process:

## comparison
- 比較条件:
- 品質基準:
- 除外条件:

## indicators
- 時間:
- 品質:
- 再作業:
- risk / incident:
- cost:

## 判断
- 継続条件:
- 停止条件:
- 再測定日:
- owner:
```

## A.8 Templateの版管理

最低限、次をrepositoryまたは管理systemへ残します。

- template IDとversion
- ownerとapprover
- 対象task・対象外task
- 変更理由
- eval結果
- security/privacy review
- rollout日とrollback方法
- 次回review日または再確認trigger

templateは「成功したprompt」の保存ではなく、依頼契約、評価、運用責任を再利用する資産です。
