# Pull Request

## 概要（必須）

- 変更内容:
- 関連 Issue:

## 影響範囲（必須）

- 対象章/ページ（例: /path/to/page/）:
- 影響（例: 追記 / 構成変更 / リンク修正 / 図表修正）:

## Phase 6 エージェント対話レビュー（該当する場合）

- [ ] agent / LLM / prompt / context / tool / eval / review の用語を確認した
- [ ] 依頼例を目的、入力境界、出力契約、受け入れ条件、検証手順、責任者に接続した
- [ ] 検証、承認、停止条件、監査ログ、ロールバックの観点を確認した
- [ ] モデル名、料金、UI、API細部など変化しやすい情報を固定値として断定していない

## レビュー（必須）

- [ ] GitHub Copilot review を依頼した
- [ ] review 本文・inline comment・suggestion を全件確認した
- [ ] 未解決 review thread 0 を確認した

## QA（必須）

- [ ] Book QA（Unicode / textlint(PRH) / 内部リンク・アンカー /
  Jekyll build / built-site smoke）: PASS
  - 実行URL: （GitHub Actions の workflow run URL）

## Pages確認（原則必須）

- 確認URL: <https://itdojp.github.io/ai-communication-book/> （fork/rename の場合は適宜読み替え）
- [ ] トップページ HTTP 200
- [ ] 主要導線（navigation.yml 相当）で 404 が無い
- [ ] 表示崩れが無い（図表/表/コード中心）

## 補足

- 既知の制約 / TODO:
