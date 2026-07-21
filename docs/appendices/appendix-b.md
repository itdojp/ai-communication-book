---
title: "付録B：参考文献とSource Registry"
chapter: appendix-b
layout: book
---

# 付録B：参考文献とSource Registry

本付録は、本文の事実主張を追跡するための **Source Registry** です。単なるリンク集ではありません。各項目にsource type、対象version/status、確認日、支える章・主張、再確認条件を記録します。

- 基準確認日: **2026-07-21**
- 法令・規格・製品仕様は変更され得ます。実務適用時は必ず最新版を再確認してください。
- 本書は法的助言、適合性認証、製品選定の保証を提供しません。

## source hierarchy

本文の根拠は、次の順で優先します。

1. **一次法令・公的機関・標準仕様**: 法令本文、政府機関、標準化団体、公式specification
2. **ベンダー公式資料**: API仕様、security guidance、changelog、deprecation notice
3. **一次研究**: 原著論文、著者・研究機関が公開するdatasetや評価手順
4. **実務補助資料**: 業界団体のguide、community資料、解説記事

下位sourceは、上位sourceの代替ではなく、実装例や論点発見の補助として扱います。URLだけでなく、本文が依拠する版・statusと確認日を記録することで、再監査可能にします。

## Registryの読み方

各source recordは次の項目を持ちます。

| 項目 | 意味 |
| --- | --- |
| source type | 公式仕様、法令、公的guidance、任意framework、一次研究など |
| 対象version/status | 確認した版、文書番号、公開状態、deprecated状態 |
| 確認日 | 本書で内容を確認した日 |
| 支える章・主張 | 本文のどの判断を支えるか |
| 再確認条件 | いつ再度一次情報を確認するか |

## モデル利用・評価・構造化出力

### OAI-STRUCTURED

- **source type**: ベンダー公式documentation
- **資料**: [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- **対象version/status**: OpenAI APIの現行guide
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第4章、第6章。schema制約は構文適合を支援するが、意味的正しさの検証を置き換えない。
- **再確認条件**: Structured Outputsのschema対応範囲、API、deprecationが変更されたとき。

### OAI-TOOLS

- **source type**: ベンダー公式documentation
- **資料**: [Using tools](https://developers.openai.com/api/docs/guides/tools)、[Function calling](https://developers.openai.com/api/docs/guides/function-calling)
- **対象version/status**: OpenAI APIの現行tools / function calling guide
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第6章、第8章。tool callを外部作用として検証・認可し、結果を信頼済み命令として扱わない。
- **再確認条件**: tool種別、permission model、Responses API、function calling契約の変更時。

### OAI-EVALS

- **source type**: ベンダー公式documentation
- **資料**: [Working with evals](https://developers.openai.com/api/docs/guides/evals)、[Evaluate agent workflows](https://developers.openai.com/api/docs/guides/agents-sdk/evals)
- **対象version/status**: 現行eval関連guide。個別サービスのlifecycleは公式deprecation情報を別途確認する。
- **確認日**: 2026-07-21
- **支える章・主張**: 第1章、第3章、第5章、第8章。task-specific dataset、grader、trace、継続的な回帰評価を組み合わせる。
- **再確認条件**: Evals APIやAgents SDKのlifecycle、grader、trace仕様が変わったとき。

### ANT-CONTEXT

- **source type**: ベンダー公式documentation
- **資料**: [Context windows](https://platform.claude.com/docs/en/build-with-claude/context-windows)
- **対象version/status**: Claude Platformの現行guide
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第4章。長い入力は無条件に品質を上げず、選別、構造化、圧縮、再取得が必要になる。
- **再確認条件**: context window、compaction、token countingの契約変更時。

### ANT-TOOLS

- **source type**: ベンダー公式documentation
- **資料**: [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview)、[Implement tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/implement-tool-use)
- **対象version/status**: Claude Platformの現行tool use guide
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第4章、第6章。tool名、説明、入力schema、error結果の設計が選択精度と運用性に影響する。
- **再確認条件**: tool schema、client/server tools、permission仕様の変更時。

### ANT-EVALS

- **source type**: ベンダー公式documentation
- **資料**: [Define success criteria and build evaluations](https://platform.claude.com/docs/en/test-and-evaluate/develop-tests)
- **対象version/status**: Claude Platformの現行test and evaluate guide
- **確認日**: 2026-07-21
- **支える章・主張**: 第1章、第3章、第5章。成功条件を先に定義し、task-specific test、automated grader、人間評価を用途に応じて組み合わせる。
- **再確認条件**: evaluation toolingや推奨手順の更新時。

### GGL-STRUCTURED

- **source type**: ベンダー公式documentation
- **資料**: [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output)
- **対象version/status**: Gemini APIの現行guide
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第4章、第6章。JSON Schemaによる出力契約と、業務上のsemantic validationを分離する。
- **再確認条件**: schema subset、SDK、API lifecycleの変更時。

### GGL-FUNCTION

- **source type**: ベンダー公式documentation
- **資料**: [Function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- **対象version/status**: Gemini APIの現行guide
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第6章。function declaration、argument validation、実行責任の分離。
- **再確認条件**: function calling mode、SDK、API lifecycleの変更時。

### GGL-TOOLS

- **source type**: ベンダー公式documentation
- **資料**: [Using tools with Gemini API](https://ai.google.dev/gemini-api/docs/tools)
- **対象version/status**: Gemini APIの現行tools overview
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第6章、第8章。外部検索・code execution等は異なるtrust boundaryと評価契約を必要とする。
- **再確認条件**: tool catalog、data handling、safety contractの変更時。

## Context・外部知識・相互運用

### MCP-SPEC

- **source type**: 公式specification
- **資料**: [Model Context Protocol Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- **対象version/status**: protocol revision 2025-11-25
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第6章。MCPはcontextやcapabilityを接続するprotocolであり、接続先の安全性や認可を自動保証しない。
- **再確認条件**: 新revision、transport、authorization、security guidanceの変更時。

### MCP-TOOLS

- **source type**: 公式specification
- **資料**: [MCP server tools](https://modelcontextprotocol.io/specification/2025-11-25/server/tools)
- **対象version/status**: protocol revision 2025-11-25、server/tools
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章、第3章、第6章、第7章、第8章。tool discovery、input schema、result、human-in-the-loopの境界。
- **再確認条件**: tools capability、schema、error、security considerationの変更時。

## Risk management・security・governance

### NIST-AIRMF

- **source type**: 公的機関の任意framework
- **資料**: [Artificial Intelligence Risk Management Framework (AI RMF 1.0)](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10)
- **対象version/status**: NIST AI 100-1、AI RMF 1.0、任意framework
- **確認日**: 2026-07-21
- **支える章・主張**: 導入、SOP、第1章、第2章、第3章、第5章、第7章、第8章。Govern、Map、Measure、Manageを組織のrisk managementへ接続する。
- **再確認条件**: AI RMF本体、Playbook、関連profileの改訂時。

### NIST-GENAI

- **source type**: 公的機関の任意profile
- **資料**: [Generative AI Profile](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence)
- **対象version/status**: NIST AI 600-1、2024-07-26公開
- **確認日**: 2026-07-21
- **支える章・主張**: 導入、SOP、第2章、第3章、第7章、第8章。生成AI固有riskを、測定、monitoring、incident、third-party riskへ接続する。
- **再確認条件**: profileの改訂、NIST GenAI programの新文書公開時。

### OWASP-LLM-2025

- **source type**: 業界security guidance
- **資料**: [OWASP Top 10 for LLM Applications 2025: Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- **対象version/status**: OWASP LLM Top 10 2025
- **確認日**: 2026-07-21
- **支える章・主張**: SOP、第2章、第3章、第6章、第8章。prompt injectionは外部contentとinstructionの混同として、権限・検証・隔離で低減する。
- **再確認条件**: Top 10の新版、risk ID、mitigation guidanceの変更時。

### OWASP-AGENTIC-2026

- **source type**: 業界security guidance
- **資料**: [OWASP Top 10 for Agentic Applications 2026](https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/)
- **対象version/status**: 2026 edition
- **確認日**: 2026-07-21
- **支える章・主張**: SOP、第3章、第8章。excessive autonomy、tool misuse、identity・memory・multi-agent境界をsystem riskとして扱う。
- **再確認条件**: edition、risk taxonomy、crosswalkの更新時。

### OWASP-AGENTIC-MITIGATIONS

- **source type**: 業界security guidance
- **資料**: [Agentic AI - Threats and Mitigations](https://genai.owasp.org/resource/agentic-ai-threats-and-mitigations/)
- **対象version/status**: OWASP GenAI Security Projectの現行resource
- **確認日**: 2026-07-21
- **支える章・主張**: 第3章、第6章、第8章。least privilege、approval、sandbox、monitoring、recoveryを組み合わせる。
- **再確認条件**: resourceまたはagentic security projectの改訂時。

### METI-AI-1-2

- **source type**: 日本政府のguidance
- **資料**: [AI事業者ガイドライン（第1.2版）](https://www.meti.go.jp/shingikai/mono_info_service/ai_shakai_jisso/20260331_report.html)
- **対象version/status**: 第1.2版、METI掲載ページ最終更新2026-04-01
- **確認日**: 2026-07-21
- **支える章・主張**: 導入、SOP、第2章、第3章、第7章、第8章。AI開発者・提供者・利用者の役割、risk-based approach、literacy、governance。
- **再確認条件**: 第1.3版以降、チェックリスト、活用の手引きの更新時。

### PPC-GENAI

- **source type**: 日本の監督機関による注意喚起
- **資料**: [生成AIサービスの利用に関する注意喚起](https://www.ppc.go.jp/news/press/2023/230602kouhou/)
- **対象version/status**: 2023-06-02公表
- **確認日**: 2026-07-21
- **支える章・主張**: 導入、SOP、第1章、第2章、第3章、第7章、第8章。個人データ入力、利用目的、providerによる取扱いを事前確認する。
- **再確認条件**: 注意喚起改訂、個人情報保護法・guideline・FAQ更新時。

### PPC-LEGAL

- **source type**: 日本の法令・監督機関資料への公式index
- **資料**: [個人情報保護委員会: 法令・ガイドライン等](https://www.ppc.go.jp/personalinfo/legal/)
- **対象version/status**: 現行法令・guideline index。2026年改正を含む最新状態は適用時に個別確認する。
- **確認日**: 2026-07-21
- **支える章・主張**: 第7章、第8章。個人情報・個人データ・第三者提供・越境移転等の適用性判断は一次法令とguidelineへ戻る。
- **再確認条件**: 法改正、施行日、guideline・FAQ改訂時。

### EU-AIACT

- **source type**: EU法令
- **資料**: [Regulation (EU) 2024/1689, Official Journal text](https://eur-lex.europa.eu/eli/reg/2024/1689/oj/eng)
- **対象version/status**: Regulation (EU) 2024/1689。2024-08-01発効、規定ごとに段階適用。
- **確認日**: 2026-07-21
- **支える章・主張**: 第3章、第7章、第8章。jurisdiction、actor、system classification、applicability、適用日を個別に判断する。
- **再確認条件**: 適用日の到来、delegated/implementing act、Commission guidance、法改正時。

## 基礎研究

### RESEARCH-TRANSFORMER

- **source type**: 一次研究
- **資料**: [Attention Is All You Need](https://arxiv.org/abs/1706.03762)
- **対象version/status**: 2017年原著論文
- **確認日**: 2026-07-21
- **支える章・主張**: 第2章。Transformerの歴史的・技術的背景。
- **再確認条件**: 固定論文のため通常不要。本文の解釈変更時に再読する。

### RESEARCH-RAG

- **source type**: 一次研究
- **資料**: [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)
- **対象version/status**: 2020年原著論文
- **確認日**: 2026-07-21
- **支える章・主張**: 第6章。retrievalとgenerationを組み合わせる基本概念。
- **再確認条件**: 固定論文のため通常不要。現行systemの評価は別途最新資料で行う。

## 更新手順

1. 本文の事実主張からsource IDへ逆引きする。
2. URLだけでなく、対象version/statusと確認日を照合する。
3. 再確認条件に該当したsourceを優先して更新する。
4. 法令、任意framework、standard、製品guidanceを同じ義務強度で書かない。
5. sourceを差し替えた場合は、支える章・主張と本文のSource Notesも同時に更新する。

次は、変化しやすいモデル名・料金・機能を確認する手順をまとめた[付録E](appendix-e/)を参照してください。
