# AIエージェント・コミュニケーション実践ガイド

AIエージェントを「うまく会話する相手」ではなく、検証可能な成果物を作る業務systemとして設計するための実務書です。

- 公開ページ: [GitHub Pages](https://itdojp.github.io/ai-communication-book/)
- 書籍トップ: [`docs/index.md`](docs/index.md)
- シリーズ: [it-engineer-knowledge-architecture](https://github.com/itdojp/it-engineer-knowledge-architecture)

## 扱う内容

- 目的、入力境界、出力契約、受け入れ条件を揃えたrequest contract
- 実taskのevalによるmodel・tool・architecture選定
- Prompt / Context Engineeringと複雑taskのworkflow設計
- RAG、tool use、MCP、structured output、権限・失敗契約
- 組織導入、品質保証、security、privacy、監査、incident対応
- 変化しやすい仕様・法制度のsource registryと再確認手順

## 読み始める

1. [はじめに](docs/introduction/index.md)
2. [AIエージェント協働の実務SOP](docs/introduction/agent-protocol.md)
3. すぐ試す場合は[第1章](docs/chapters/chapter-01/index.md)、評価・選定から始める場合は[第3章](docs/chapters/chapter-03/index.md)

## 品質契約

- 本文8章は、読者、到達点、最短route、深掘りroute、章末checklist、次の導線、Source Notesを持ちます。
- 変化しやすい主張は、一次情報、対象version/status、確認日、再確認条件へ接続します。
- AIの内部推論開示ではなく、観点、仮説、中間成果物、根拠、未確認点、検証結果をreview対象にします。
- `npm test` とBook QAでmetadata、editorial contract、security audit、Markdown、linkを検査します。

## 開発

```bash
npm ci
npm test
npm run build
```

詳細は [`CONTRIBUTING.md`](CONTRIBUTING.md) を参照してください。

## License

[CC BY-NC-SA 4.0](LICENSE.md)
