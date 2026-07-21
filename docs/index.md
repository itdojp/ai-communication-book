---
layout: book
title: "AIエージェント・コミュニケーション実践ガイド"
description: "AIエージェントの業務設計・評価・品質保証を、成果物と運用契約から学ぶ実務ガイド"
author: "株式会社アイティードゥ"
version: "2.0.0"
order: 1
permalink: /
---

# {{ page.title }}

{{ page.description }}
{: .fs-6 .fw-300 }

---

## 本書の目的

本書は、AIへの「うまい聞き方」を集めたprompt集ではありません。目的、入力境界、出力契約、評価、承認、監査を組み合わせ、AIエージェントを**業務で検証可能な成果物へつなぐ方法**を扱います。

読了後は、次のことができる状態を目指します。

- AIに任せるtaskと、人間が責任を持つ判断を分ける
- 実taskのevalでmodel、tool、architectureを比較する
- prompt、context、schema、中間成果物をrequest contractとして設計する
- RAG、tool use、MCPを権限・失敗・監査まで含めて設計する
- 個人の試行を、組織の標準・品質保証・incident対応へ接続する
- 変化しやすい仕様や法制度を、版・確認日・再確認条件付きで扱う

## 最初に読むページ

1. [はじめに](introduction/)で、自分の読者routeと到達点を選ぶ
2. [AIエージェント協働の実務SOP](introduction/agent-protocol/)で、全章共通の承認・停止・検証契約を確認する
3. まず試す場合は[第1章](chapters/chapter-01/)、system設計から始める場合は[第3章](chapters/chapter-03/)へ進む

## 読者別route

| 読者 | 最短route | 得られる成果物 |
| --- | --- | --- |
| ビジネス職 | 第1章 → 第4章 → 付録A | 安全な依頼票、再利用template |
| プロジェクトマネージャー | SOP → 第3章 → 第5章 → 第7章 | Eval Spec、task plan、導入roadmap |
| エンジニア | 第2章 → 第4章 → 第5章 → 第6章 → 第8章 | Request Contract、tool/RAG設計、Runbook |
| マネージャー | はじめに → 第3章 → 第7章 → 第8章 | 選定判断、責任分界、governance checklist |
| QA・security・audit | SOP → 第3章 → 第8章 → 付録C | Acceptance gate、監査log契約、Postmortem |

## 8章の構成

### [第1章：即効性のある活用法](chapters/chapter-01/)

役割別の30分quick startから始め、最小依頼、Before/After、失敗時の再依頼、KPI測定契約までを扱います。

**成果物**: 最小request、self review、Measurement Contract

### [第2章：実務判断に必要な技術理解](chapters/chapter-02/)

token、context、不確実性、sampling、tool use、限界を、業務判断へ必要な範囲で説明します。未公表の内部仕様や創発閾値を選定根拠にしません。

**成果物**: Constraint Map、任せる/任せない境界

### [第3章：評価設計とモデル・ツール選定](chapters/chapter-03/)

benchmarkの順位ではなく、実taskのsuccess/failure、offline eval、regression、workflow acceptance、human reviewで比較します。

**成果物**: Eval Spec、比較表、PoC plan、再選定trigger

### [第4章：Prompt / Context Engineering の基礎](chapters/chapter-04/)

目的、入力、制約、reference、example、schema、出力契約、versioningを、一つのrequest contractにします。

**成果物**: Request Contract、Context Package、versioned template

### [第5章：複雑タスクの分解・実行・検証](chapters/chapter-05/)

複雑な仕事をplan、中間成果物、承認、completeness、recoveryへ分解し、ADR、PR、Runbook等へ落とします。

**成果物**: Execution Plan、中間成果物一覧、Failure Recovery Plan

### [第6章：知識連携とツール連携](chapters/chapter-06/)

context、retrieval、toolの選択、RAG、citation、MCP、structured output、permission、retry、timeout、loggingを扱います。

**成果物**: Retrieval/Tool Design、schema、permission matrix

### [第7章：組織導入と運用設計](chapters/chapter-07/)

ユースケース選定、責任分界、教育、変更管理を「試す→定着→標準化→監査可能化」の順で設計します。

**成果物**: Use Case Portfolio、RACI、導入roadmap、KPI contract

### [第8章：品質保証・リスク管理・コンプライアンス](chapters/chapter-08/)

品質gate、monitoring、prompt injection、data leakage、excessive autonomy、監査log、incident、国内外の確認観点を運用体系にします。

**成果物**: Control Matrix、Audit Log Contract、Incident Runbook

## 付録

- [付録A：AIエージェント実務テンプレート集](appendices/appendix-a/): Job Spec、Context Package、Patch、Incident、Eval、Measurement
- [付録B：参考文献とSource Registry](appendices/appendix-b/): 一次情報、版、確認日、支える主張、再確認条件
- [付録C：成果物テンプレート集](appendices/appendix-c/): ADR、PR、Runbook、Postmortem
- [付録D：実務会話例集](appendices/appendix-d/): instructionから中間成果物・最終成果物への対応
- [付録E：用語集と更新確認ノート](appendices/appendix-e/): 変化しやすい情報の確認手順

## 本書の4層model

| 層 | 問い | 主要章 |
| --- | --- | --- |
| Task | 何を任せ、何を成果物とするか | 第1・5章 |
| Interaction | どのcontext・instruction・schemaを渡すか | 第2・4章 |
| System | どのmodel・retrieval・tool・controlを組み合わせるか | 第3・6章 |
| Operations | 誰が承認し、どう測定・監査・改善するか | 第7・8章 |

上位層だけを整えても、下位層の失敗は防げません。たとえば良いpromptがあっても、tool権限が過大であれば安全ではありません。逆にcontrolを増やしても、taskの成功条件が曖昧なら品質を判定できません。

## 共通原則

### 成果物を先に決める

AIに何を言わせるかではなく、誰が何に使い、どの条件で採用する成果物かを先に決めます。

### 観測事実と推論を分ける

出力には、根拠、仮定、未確認点、検証手順を残します。内部推論の開示ではなく、review可能な作業成果物を要求します。

### 権限はtaskより狭く始める

read-only、限定scope、事前承認から始め、evalと運用証拠に応じて拡張します。

### 変化する情報を固定しない

model名、料金、UI、API、法制度は、固定表より確認方法を重視します。事実主張は[Source Registry](appendices/appendix-b/)へ接続します。

### 失敗を運用へ戻す

不正確な出力、tool failure、review漏れ、incidentを、dataset、template、control、Runbookの更新へ戻します。

## 前提知識

- 文書、表、checklistを読んで業務要件を整理できること
- 組織のsecurity/privacy policyを確認できること
- 第6章の実装詳細を読む場合は、HTTP/API、JSON Schema、認証・認可の基礎があると理解しやすい

特定のAI製品やprogramming languageの利用経験は必須ではありません。

## Source・更新policy

- 変化しやすい事実は一次情報を優先する
- source type、対象version/status、確認日、支える主張、再確認条件を記録する
- 法令、政府guidance、任意framework、standard、vendor documentationを同じ義務強度で扱わない
- 最新確認方法は[付録E](appendices/appendix-e/)を使う

**Source Registry基準確認日**: 2026-07-21  
**本版**: v2.0.0（Issue #131に基づく2026年版全面改稿）

## 利用上の注意

本書は一般的な教育・実務設計の資料です。法務、security、privacy、労務、医療等の専門判断を代替しません。実際のdata、system、jurisdiction、契約に応じて、組織の責任者と専門家へ確認してください。

## ライセンスとfeedback

- License: CC BY-NC-SA 4.0
- Repository: [itdojp/ai-communication-book](https://github.com/itdojp/ai-communication-book)
- 誤り・改善提案: [GitHub Issues](https://github.com/itdojp/ai-communication-book/issues)
