---
title: "付録E：用語集と更新確認ノート"
chapter: appendix-e
layout: book
---

# 付録E：用語集と更新確認ノート

本付録は、本文で使う語の最小定義と、変化しやすい情報を読者自身が再確認する手順をまとめます。基準確認日は **2026-07-21** です。モデル名、料金、API、提供地域、機能差分を固定値として暗記するのではなく、公式情報を再現可能な手順で確認してください。

## E.1 本書の中核用語

### AI agent

目的に向けて、モデル応答、tool use、状態管理、検証、停止を組み合わせるsystem。本書では、自律性そのものより、権限、承認ゲート、停止条件、証拠、責任分界を重視します。

### LLM

大量のtext等からpatternを学習し、入力に対するtoken列を生成するmodel。流暢さは事実性や業務上の正しさを保証しません。

### prompt

modelへ渡すinstructionやrequest。本書では単独の文章技法ではなく、context、tool、output contract、evalを含むworkflowの一部として扱います。

### context

modelがその実行時に参照できるinstruction、会話、文書、tool結果等。長くすれば必ず良くなるわけではなく、関連性、優先順位、鮮度、機密区分が必要です。

### request contract

目的、入力境界、出力契約、受け入れ条件、検証、ownerを揃えた依頼仕様です。[SOP](../introduction/agent-protocol/)と[付録A](appendix-a/)で具体化します。

### tool use

modelが検索、database、code実行、業務API等の外部capabilityを選択・要求すること。modelがtool callを生成しても、認可、入力検証、実行、結果検証の責任はsystem側に残ります。

### MCP

Model Context Protocol。clientとserverの間でcontextやcapabilityを接続するprotocolです。protocol準拠は接続先の安全性を保証しないため、identity、authorization、allowlist、loggingを別途設計します。

### structured output

JSON Schema等の構造に合わせて出力させる機能またはpattern。構文適合とsemantic correctnessは別であり、業務ruleによる検証が必要です。

### RAG

Retrieval-Augmented Generation。外部sourceを検索し、取得結果を生成へ渡すarchitectureです。分割、index、検索、再rank、引用、権限、鮮度、評価を含むsystemとして扱います。

### eval

modelまたはworkflowが成功条件を満たすか測る評価。dataset、expected behavior、grader、human review、failure analysisを組み合わせます。

### regression eval

既存の重要caseが変更後も維持されるかを確認する評価。model、prompt、retrieval、tool、policyの変更gateに使います。

### acceptance check

個々の出力またはworkflow全体について、採用可能か判定する検査。形式、事実、業務rule、安全性、人間承認を含みます。

### guardrail

許可・禁止・停止・escalationを実装するcontrol。単一filterではなく、入力、tool、出力、権限、monitoring、incident responseに配置します。

### prompt injection

外部content内の文字列等によって、systemがdataとinstructionを取り違え、意図しない動作へ誘導されるriskです。

### hallucination

根拠がない、または入力・sourceと整合しない内容を、もっともらしく生成する現象です。検索、引用、検証、承認のsystem設計で影響を抑えます。

### human review

人間が業務責任に基づいて成果物、根拠、riskを確認するgate。すべてを人手で読むのではなく、高影響・低検出性・不確実な箇所へ重点配置します。

### auditability

誰が、何を入力し、どの版・権限で実行し、何が出力され、どの検証・承認を経たかを、後から説明できる性質です。

## E.2 変化しやすい情報の確認手順

### 1. 確認対象をclaimへ分解する

「モデルAが優れている」ではなく、次のように検証可能なclaimへ分けます。

- 対象APIで必要なstructured outputを使えるか
- 想定regionで利用できるか
- 入力dataが学習や保持にどう扱われるか
- 必要なlatencyとthroughputを満たすか
- tool useと監査logの要件を満たすか
- 料金計算にinput、output、cache、tool等のどの項目が含まれるか

### 2. source hierarchyに従う

1. 公式API reference、product documentation、security/privacy terms
2. 公式pricing、status、deprecation、changelog
3. 公的機関、standard、一次法令
4. 一次研究
5. 解説記事やcommunity情報は論点発見だけに使う

source registryは[付録B](appendix-b/)を参照してください。

### 3. 確認記録を残す

```text
確認対象:
利用目的:
公式URL:
対象version/status:
確認日: YYYY-MM-DD
確認したclaim:
未確認点:
再確認条件:
確認者:
```

### 4. 実環境で検証する

documentation上の可否だけでなく、最小datasetと代表taskで次を確認します。

- output schema適合
- 日本語の業務用語と表現
- failure時のerrorとretry挙動
- tool timeout、partial failure、idempotency
- prompt injection等のnegative case
- cost、latency、rate limit
- logに機密情報が残らないこと

### 5. 再確認triggerを決める

次のいずれかで再確認します。

- model、API、SDK、MCP specificationのversion変更
- pricing、terms、data handling、regionの変更
- deprecation noticeまたはchangelog
- 法令、government guideline、standardの改訂・施行日到来
- security advisory、incident、監査指摘
- production品質・cost・latencyの閾値逸脱

## E.3 法令・framework・standardの区別

| 種別 | 例 | 読み方 |
| --- | --- | --- |
| 法令 | EU AI Act、個人情報保護法 | jurisdiction、actor、system、施行日、例外を確認する |
| 政府guidance | AI事業者ガイドライン、PPC注意喚起 | 組織の役割や実務観点へ落とし、法的義務と混同しない |
| 任意framework | NIST AI RMF | risk managementの共通言語として採用範囲を決める |
| standard | management systemや技術standard | 対象scope、版、適合性・認証の要否を確認する |
| vendor documentation | API guide、security terms | 契約、version、提供状態を実環境と照合する |

適用判断は組織の法務、security、privacy、audit担当と行い、必要に応じて専門家へ確認してください。

## E.4 更新監査チェックリスト

- [ ] 変化しやすいclaimに公式URLと確認日がある
- [ ] 対象version/statusを記録した
- [ ] 法令、任意framework、standard、vendor guidanceを区別した
- [ ] 本文のSource Notesから付録Bへ追跡できる
- [ ] 固定値より確認手順を優先した
- [ ] 実taskのevalとnegative caseを実施した
- [ ] 再確認条件とownerを決めた
- [ ] 古いsourceを削除するだけでなく、本文claimを再評価した

## E.5 読み直しの入口

- モデル・tool選定を更新する: [第3章](../chapters/chapter-03/)
- prompt/contextの契約を更新する: [第4章](../chapters/chapter-04/)
- RAG・tool・MCPを更新する: [第6章](../chapters/chapter-06/)
- governance・法令・securityを更新する: [第8章](../chapters/chapter-08/)
