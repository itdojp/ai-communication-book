---
title: "第3章：評価設計とモデル・ツール選定"
chapter: chapter03
layout: book
order: 5
---

# 第3章：評価設計とモデル・ツール選定

## この章の使い方

### 誰向け

- 生成AIの導入候補はあるが、どの model や tool を選ぶべきか判断基準を持てていない人。
- PoC を「とりあえず触ってみた」で終わらせず、成功条件、失敗条件、guardrail を定義したい人。
- benchmark の点数ではなく、実タスクで採用判断できる評価設計を作りたい人。
- 導入後も regression eval と運用モニタリングで品質を維持したい人。

### この章でできるようになること

- task definition を書き、成功、失敗、guardrail を評価可能な形に落とし込める。
- offline eval / regression eval / workflow-level acceptance check / human review を役割分担して設計できる。
- model、tool、workflow を、quality だけでなく cost、latency、運用性、リスクで比較できる。
- PoC を採用可否の判断材料として設計し、導入後の継続評価へ接続できる。

### 最短ルート

1. 3.1 で benchmark の位置づけを確認する。
2. 3.2 で task definition、成功、失敗、guardrail を定義する。
3. 3.3 で offline eval / regression eval / workflow-level acceptance check / human review の使い分けを押さえる。
4. 3.4 と 3.5 で比較軸と PoC 設計に進む。

### 深掘りルート

1. 3.1 から 3.4 を通読し、評価設計の全体像を作る。
2. 3.5 で PoC の仮説とデータセット設計を具体化する。
3. 3.6 と 3.7 で継続評価、監視、更新判定まで固める。
4. 章末テンプレートを使って、自チームの選定メモを作る。

## はじめに

model 選定の議論は、しばしば次のように始まる。

- いちばん性能が高い model を使えばよいのではないか。
- 安い model を大量に回した方が得ではないか。
- benchmark のスコアが高い製品を選べば安全ではないか。
- 社内で評判の良い tool を使えば十分ではないか。

しかし、実務ではこれらだけで選ぶと失敗する。理由は単純で、業務の成功条件は benchmark の得点表に書かれていないからだ。たとえば問い合わせ対応補助で重要なのは、一般常識スコアよりも次のことかもしれない。

- 禁止回答をしないこと
- 社内規程に沿うこと
- 参照元を示せること
- 2秒以内に返ること
- review_required へ適切に逃がせること

逆に、稟議文の下書きでは、多少遅くても論点整理の質や文脈理解の方が重要かもしれない。つまり、選定は model の絶対性能ではなく、タスクとの適合で決めるべきである。本章では benchmark を補助情報として扱いつつ、中心には実タスク eval を置く。一次情報の確認日は 2026-07-21 である。評価機能、tool 機能、長文性能、built-in tool の提供形態、preview/stable 状態、ガバナンス要件は変わりうる。本文では原則と設計方法を中心にし、固定的な製品比較表には依存しない。

## 3.1 benchmark は入口、採用判断は実タスク eval で行う

### benchmark をどう使うべきか

benchmark は無意味ではない。むしろ候補の絞り込みには有効である。ただし、用途は限定すべきだ。benchmark が向く場面:

- 候補 model の大まかな能力帯を把握する。
- 明らかに用途不適合な候補を落とす。
- model 世代更新時の参考差分を見る。

benchmark が向かない場面:

- そのまま本番採用を決める。
- 社内データ、社内規程、社内文体との相性を判断する。
- tool use を含む workflow 全体の品質を測る。
- human review 工数まで含めた総コストを見積もる。

### なぜ benchmark だけでは足りないのか

実務タスクでは、問題の形が benchmark とずれていることが多い。

| benchmark 的課題 | 実務タスク |
| --- | --- |
| 問いが明確 | 依頼自体が曖昧 |
| 正解ラベルがある | 正解が複数ありうる |
| 単発回答中心 | 複数ターン、複数 tool、複数承認がある |
| 外部状態変更なし | チケット更新、メール下書き、台帳登録がある |
| 安全制約は単純 | 法務、個人情報、社内規程が絡む |

この差を無視すると、「benchmark では強いのに現場では使いにくい」現象が起こる。

### benchmark を補助情報として使う手順

1. まず task definition を書く。
2. その task に近い benchmark があるかを見る。
3. あれば shortlist の参考にする。
4. 最終判断は実タスク eval に移す。

順番を逆にしてはいけない。先に benchmark を見てから用途を探すと、過剰機能か過小機能を選びやすい。

### benchmark の読み方を誤らない

スコア差があっても、現場差が出ないことがある。逆に、総合 benchmark が似ていても、structured output の安定性や tool orchestration の出来で大きな差が出ることもある。実務上は、次の読み方が安全である。

- benchmark は能力帯の目安。
- 実タスク eval は採用判断の本体。
- workflow-level の確認が最終関門。

### benchmark が特に役立つ局面

それでも benchmark が役立つ局面はある。

- コーディング補助を導入したい。
- 数学・推論寄りタスクが多い。
- 多言語要件があり候補が多い。
- 予算の都合で試せる候補数を絞りたい。

この場合でも、最終的には自社タスクで確認する。

### benchmark を実務指標へ翻訳する

例えば次の翻訳が必要である。

- 推論 benchmark が高い → 論点整理や段階判断に向く可能性がある
- code benchmark が高い → テスト生成やコード説明で有利かもしれない
- 多言語 benchmark が高い → 英日混在文書の理解で候補に入る

ここで止める。「向く可能性がある」を「そのまま採用」で終わらせない。

## 3.2 task definition が評価設計の土台になる

### まず task definition を書く

評価設計は、タスク定義なしでは始まらない。task definition は、最低でも次を含む。

- 利用場面
- 入力
- 出力
- 利用者
- 成功条件
- 失敗条件
- guardrail
- 人間の関与点

### 良い task definition の条件

良い task definition は、model 名を入れなくても読める。つまり、「何をしたいか」がベンダー非依存で表現されている。

#### 悪い例

```text
高性能 model で問い合わせ対応を自動化する。
```

これでは評価できない。

#### 改善例

```text
顧客からの問い合わせメールを入力として、
社内FAQ、契約プラン情報、障害告知を参照しながら、
返信下書きと参照根拠を生成する。
機密情報を含む場合、契約外の約束が必要な場合、または根拠が不足する場合は review_required にする。
最終送信は人間が行う。
```

これなら、何を測るべきかが見える。

### success を定義する

success は「便利だった」では弱い。観測可能な条件にする。

#### 例: 問い合わせ返信下書き

success の例:

- FAQ または契約情報に基づく根拠がある。
- 禁止表現を含まない。
- review_required 条件で無理に回答しない。
- 返信骨子がそのまま担当者レビューに使える。
- 完了時間が SLA 内に収まる。

### failure を定義する

failure を先に書くと、評価が現実的になる。failure の例:

- 契約にない約束を断定する。
- FAQ にない情報を推測で補う。
- 個人情報を不要に再出力する。
- 根拠欄が空なのに断定する。
- schema が壊れて後続処理が止まる。

### guardrail を定義する

guardrail は、品質基準とは少し違う。「超えてはいけない線」を定義するものである。例:

- 個人情報の不要出力禁止
- 差別的表現の禁止
- 法務確認なしの断定禁止
- root 権限相当の操作禁止
- 外部送信前 confirmation 必須

guardrail は、良い回答を作る条件ではなく、事故を起こさない条件である。

### 4分類で整理すると書きやすい

task definition は次の4分類で整理するとよい。

#### 1. 事実タスク

- 要約
- 抽出
- 分類
- 差分検出

重い評価軸:

- 事実性
- 網羅性
- schema 準拠

#### 2. 判断支援タスク

- 稟議レビュー
- 契約論点抽出
- 障害優先度の候補提示

重い評価軸:

- 根拠提示
- review_required の適切さ
- 失敗時の安全側への倒し方

#### 3. 生成タスク

- メール下書き
- 提案書草案
- 研修資料の骨子

重い評価軸:

- 文脈適合
- 読みやすさ
- トーン整合

#### 4. 実行連携タスク

- チケット起票
- 台帳更新
- 承認 workflow 分岐

重い評価軸:

- tool 引数正確性
- 権限境界順守
- 監査可能性

### task definition テンプレート

```text
タスク名:
利用場面:
入力:
出力:
success:
failure:
guardrail:
human review:
```

### task definition のレビュー観点

- その task は本当に単一 task か。
- 1ターンでやらせる必要があるか。
- 失敗時の処理が書かれているか。
- human review 条件が曖昧でないか。
- 後続システムとの I/O 契約が明確か。

## 3.3 評価レイヤを分けて設計する

### 単一の評価では足りない

実務では、1つの評価だけで品質を判断すると抜けが出る。なぜなら、次を同時に見なければならないからだ。

- 単発回答の質
- 更新後の劣化有無
- workflow 全体の成立
- 人間レビュー負荷

そこで、評価レイヤを分ける。

### offline eval

offline eval は、保存済みデータセットで候補を比較する評価である。主な目的は、候補の足切りと改善方向の把握である。

#### offline eval で見るもの

- 正答率
- schema pass 率
- 根拠付き率
- 禁止回答率
- review_required 判定の妥当性
- tool 引数正確性

#### offline eval の利点

- 同条件で比較しやすい。
- 速く回せる。
- prompt や schema の改善効果を測りやすい。
- 候補 model を絞りやすい。

#### offline eval の限界

- 本番の時間制約やネットワーク揺れを含まない。
- ユーザーの曖昧入力を十分に再現しにくい。
- tool 障害や承認待ちを再現しにくい。

### regression eval

regression eval は、変更後に既存品質が落ちていないかを見る評価である。対象となる変更:

- model 変更
- prompt 変更
- schema 変更
- tool 定義変更
- 検索基盤変更
- guardrail 変更

#### regression eval が重要な理由

AI システムは、改善したつもりで別の箇所を悪化させやすい。

- JSON は安定したが、文章品質が落ちる。
- 長文要約は改善したが、cost が急増する。
- 安全側に倒したが、review_required が増えすぎる。

こうした退行は、感覚では見落としやすい。

#### regression eval に入れるべきケース

- 以前失敗した代表ケース
- 壊すと困る高頻度ケース
- 高リスクケース
- 境界条件ケース
- 例外系

### workflow-level acceptance check

workflow-level acceptance check は、model 単体ではなく、tool、権限、承認、外部連携を含む業務フロー全体が受け入れ可能かを見る確認である。ここが、benchmark と offline eval だけでは拾えない領域である。

#### workflow-level acceptance check で見るもの

- tool 呼び出し順序が妥当か
- 必要な approval を飛ばしていないか
- timeout や tool failure から回復できるか
- 最終成果物が業務で本当に使えるか
- ユーザーが待てる時間で完了するか
- 監査ログが残るか

#### 実例: 申請レビュー補助

単体では合格でも、全体では失敗する例がある。

- model の判定文は正しい
- しかし tool result の顧客ランクが stale
- approval 画面への引き渡し項目が欠ける
- ログに根拠 ID が残らない

これでは本番導入できない。

### human review

human review は、最後の保険ではない。評価レイヤの一部として設計する。見るべき点は2つある。

- AI 出力の質
- AI を使ったときの人間作業の負担

#### human review で測るべき項目

- レビュー時間
- 差戻し率
- 差戻し理由
- 修正量
- 説明しにくい出力の頻度
- 安全上の不安を感じるケース

#### human review の設計を誤る例

- 何を見るか未定義
- レビュアーごとに判断軸が違う
- 差戻し理由が記録されない
- 「何となく不安」で採点する

#### human review を評価に組み込む例

- 5分以内に妥当性確認できるか
- 根拠欄だけで判断材料が足りるか
- review_required 判定が過不足ないか
- レビュー担当の心理的負荷が高すぎないか

### 4レイヤをどう組み合わせるか

| レイヤ | 主目的 | タイミング |
| --- | --- | --- |
| offline eval | 候補比較、改善方向把握 | PoC 初期、改善反復 |
| regression eval | 退行防止 | 変更前後、リリース前 |
| workflow-level acceptance check | 業務フロー受け入れ判断 | 採用前、本番前 |
| human review | 実運用負荷と最終安全確認 | PoC 後半、本番運用 |

### 小さく始めるときの最小構成

リソースが限られる場合でも、次は外さない。

1. 20〜50件の offline eval
2. 退行防止用 regression eval の固定ケース
3. 3〜5本の workflow-level acceptance check シナリオ
4. 実担当者による human review

これだけでも、印象評価よりはるかに強い判断材料になる。

## 3.4 比較軸を先に固定し、モデルとツールを同じ表で見る

### 比較表はベンダー名より軸が重要

model 選定で失敗しやすいのは、「どれが良いか」から考えることだ。先に決めるべきは、「何を良いとみなすか」である。

### 基本の比較軸

#### 1. task quality

- 正答率
- 根拠提示
- schema pass 率
- review_required の適切さ
- 出力一貫性

#### 2. latency

- p50 / p95 応答時間
- tool 込み完了時間
- 初回表示時間

#### 3. cost

- 1件あたり API コスト
- tool 実行費
- review 工数込み総コスト

#### 4. context handling

- 長文入力の扱いやすさ
- 情報圧縮のしやすさ
- context overflow 時の挙動の把握しやすさ

#### 5. structured output / tool reliability

- schema 準拠の安定性
- tool call 引数の正確性
- failure handling のしやすさ
- 並列・逐次 tool 呼び出しへの適性

#### 6. operability

- ログの取りやすさ
- 監査性
- 再試行設計のしやすさ
- model 更新追随のしやすさ

#### 7. safety / governance

- guardrail 設定のしやすさ
- 個人情報や機密情報の扱い
- human approval 設計との整合
- 規制・社内規程への適合説明のしやすさ

### model だけでなく tool も比較対象に入れる

業務成果は model 単体では決まらない。次も比較対象に含める。

- web search
- file search / retrieval
- function calling
- code execution
- remote MCP 連携
- custom tool orchestration

同じ model でも、tool 基盤の差で workflow-level の完成度が変わる。

### 例: 社内ナレッジ回答支援の比較軸

| 軸 | 重みの例 | 理由 |
| --- | --- | --- |
| 根拠提示 | 高 | 社内規程を誤ると事故になる |
| latency | 中 | 一次回答補助なので待ち時間は重要 |
| cost | 中 | 問い合わせ量が多い |
| 長文耐性 | 中 | 規程、FAQ、案件履歴を扱う |
| tool reliability | 高 | 検索不安定だと回答不能になる |
| human review 負荷 | 高 | 担当者の工数に直結する |

### 例: 提案書下書き支援の比較軸

| 軸 | 重みの例 | 理由 |
| --- | --- | --- |
| 文脈理解 | 高 | 顧客背景と提案筋道が重要 |
| 日本語品質 | 高 | そのまま叩き台として使うため |
| latency | 低〜中 | 数秒の差より内容が重要 |
| cost | 中 | 利用頻度次第で管理対象 |
| structured output | 低 | 最終成果物が自然文中心 |
| tool reliability | 中 | 事例検索や製品情報取得がある |

### 先に落とす条件を決める

候補比較では、「何点以上なら採用」だけでなく「この条件なら不採用」を決める。例:

- schema pass 率が一定未満なら不採用
- guardrail 違反が1件でもあれば再設計
- review 時間が人手作業と大差ないなら不採用
- tool failure 時の回復手順が設計できないなら不採用

### リスクで重みを変える

同じ task でも、リスクで重みは変わる。

#### 低リスク

- 会議タイトル案
- 社内アイデア発散
- 下書きのたたき台

重い軸:

- cost
- latency
- 使いやすさ

#### 中リスク

- FAQ 一次回答
- 社内申請の事前チェック
- ナレッジ検索補助

重い軸:

- 根拠提示
- review_required の適切さ
- tool reliability

#### 高リスク

- 契約判断支援
- 個人情報を含む業務
- 外部状態変更を伴う運用

重い軸:

- guardrail
- human approval
- 監査性
- rollback 可否

### 選定会議で使う比較表テンプレート

- offline eval 総評
- regression eval
- workflow-level acceptance check
- human review 負荷
- cost
- latency
- structured output 安定性
- tool use 適性
- ガバナンス適合性
- 採用判断

## 3.5 PoC は「試す場」ではなく採用判断を下す場である

### PoC の目的を明確にする

PoC で最も多い失敗は、目的が曖昧なことだ。

- とりあえず触ってみる
- デモが動けばよい
- 関係者が面白いと感じればよい

これでは採用判断に使えない。PoC では次のどれを決めるのかを明示する。

- 導入するか
- どのリスクまで許容するか
- どの workflow に限定導入するか
- human review をどこに置くか
- 次フェーズで何を追加検証するか

### PoC の仮説を立てる

PoC は仮説検証である。良い仮説の例:

- 「FAQ 一次回答では、検索付き構成なら手作業よりレビュー時間を短縮できる」
- 「申請レビューでは、structured output にすると差戻し理由の記録品質が上がる」
- 「軽量 model + review_required 方式なら、品質を保ったまま cost を抑えられる」

悪い仮説の例:

- 「AI を入れると効率化できるはず」

### PoC の最小構成

#### 1. 対象 task を絞る

PoC で多機能にしすぎると、何が効いたか分からない。まずは1 task か、せいぜい関連2 task に絞る。

#### 2. ベースラインを決める

比較対象がない PoC は評価できない。ベースライン候補:

- 完全手作業
- 現行ルールベース
- 既存の軽量 model 構成
- 既存の FAQ 検索のみ構成

#### 3. データセットを作る

PoC 用データは、きれいな成功例だけでなく、難例を含める。含めたいケース:

- 高頻度ケース
- 高リスクケース
- 境界ケース
- 欠損情報ケース
- tool miss が起きやすいケース

#### 4. 受け入れ基準を決める

PoC の終わりに「それで、採用するのか」を決められる基準を置く。例:

- offline eval の基準達成
- workflow-level acceptance check の主要シナリオ通過
- human review 時間の短縮
- guardrail 違反ゼロ
- 総コストが許容範囲内

### PoC で見るべき副作用

PoC では、表の成功だけでなく副作用を見る。

- レビュー担当の負荷が増えていないか
- 説明責任が弱くなっていないか
- 例外処理が増えていないか
- ログ保存が難しくなっていないか
- tool 権限が過剰になっていないか

### PoC レポートに必須の項目

- task definition
- 仮説
- 比較対象
- データセット概要
- offline eval 結果
- regression eval 方針
- workflow-level acceptance check 結果
- human review 所見
- cost 見積
- リスクと未解決事項
- 採用 / 条件付き採用 / 不採用 の判断

### PoC の判断を3段階に分ける

#### 採用

- 主要受け入れ基準を満たす
- guardrail 違反なし
- review 負荷が許容範囲
- 運用設計が組める

#### 条件付き採用

- 主目的は達成したが、高リスクケースは review_required に限定する
- tool 権限を再設計する必要がある
- データセット拡張後に再判定する

#### 不採用

- ベースラインを上回らない
- review 工数が増える
- guardrail 違反が解消できない
- workflow-level で業務要件を満たせない

## 3.6 継続評価を前提に運用する

### 導入後に品質は変わる

AI システムは、導入した瞬間が完成ではない。品質が変わる要因は多い。

- model 更新
- prompt 改修
- 検索インデックス更新
- tool 定義変更
- 業務ルール変更
- ユーザーの使い方変化

このため、継続評価は必須である。

### 継続評価で見るもの

- quality drift
- safety drift
- review 負荷の増減
- latency 悪化
- cost 増加
- 例外系の増加

### ログから作る観測指標

| 指標 | 意味 |
| --- | --- |
| review_required 率 | model が安全側に倒れているか、逃げすぎていないか |
| 差戻し率 | 出力品質が落ちていないか |
| 根拠欠落率 | 参照設計が崩れていないか |
| tool failure 率 | 外部連携の安定性 |
| p95 完了時間 | ユーザー体験の悪化検知 |
| 1件総コスト | token 増、再試行増の検知 |

### 定期 regression eval を運用へ組み込む

推奨されるタイミング:

- model 切替前
- prompt / schema 更新前後
- 検索インデックス更新後
- guardrail 変更後
- 月次または四半期レビュー

### 本番データから eval ケースを育てる

継続評価では、最初に作ったデータセットだけでは足りない。本番から次を追加する。

- 差戻しが多いケース
- ユーザー苦情が出たケース
- 監査で指摘されたケース
- 例外的に良かったケース
- 新しい業務パターン

これにより eval は現場に追従する。

### canary と段階展開

変更を一気に全体へ出すより、段階展開の方が安全である。

- 一部チームで先行
- 一部案件で先行
- 低リスク task だけ先行
- review_required を厚くして先行

canary では、旧構成と新構成を同じ基準で比較する。

### 「使えるが危ない」を放置しない

導入後にありがちなのが、現場が便利さを感じるあまり、当初の制限を外していくことだ。

- review_required を減らす
- 承認なし tool を増やす
- ログを簡略化する
- 高リスク文面もそのまま送る

こうした運用 drift を防ぐには、評価とガバナンスを接続する必要がある。

- 変更申請
- 受け入れ基準
- ログ監査
- 定期レビュー

## 3.7 モデル選定とツール選定を分離しつつ接続する

### model が良くても tool 設計が悪ければ失敗する

model 選定と tool 選定は別物だが、実務では接続して考える必要がある。たとえば、回答品質が高い model でも、必要な検索、構造化引数、承認ゲートとの接続が弱ければ採用しにくい。逆に、model は中庸でも、tool orchestration と review 設計が良ければ十分な成果が出ることがある。

### model 選定の観点

- task に必要な reasoning / writing / extraction の適性
- 長文入力や要約の安定性
- structured output の扱いやすさ
- tool call の安定性
- latency / cost
- 更新追随のしやすさ

### ツール選定の観点

- 必要な情報源へ接続できるか
- 権限を最小化できるか
- 監査ログを残せるか
- failure を扱いやすいか
- built-in と custom をどう分けるか
- MCP など標準的な接続で疎結合にできるか

### built-in tools と custom tools の考え方

2026-07-21 時点の一次情報では、主要プラットフォームは built-in tool と custom tool の両方を提供する方向に進んでいる。設計上は次で分けると扱いやすい。

#### built-in tools を優先しやすい場面

- web 検索
- file search
- code execution
- プラットフォーム標準の安全機構を活用したい場面

#### custom tools を優先しやすい場面

- 社内固有 API
- 厳密な権限制御
- 業務独自の approval flow
- 監査用 metadata を細かく残したい場面

### MCP を選択肢に入れる場面

MCP は、model と外部ツール・データ接続を標準化する選択肢として重要である。向いている場面:

- 複数ツールを疎結合で管理したい
- ベンダーごとに個別実装を増やしたくない
- tool metadata と UI で利用者へ可視化したい
- human approval を含むホスト側制御を持ちたい

ただし、MCP を使えば安全になるわけではない。ツール説明、権限、承認、監査設計は別途必要である。

### 選定判断の実例

#### 例1: 社内FAQ回答支援

- model 重視点: 要約、根拠提示、日本語品質
- tool 重視点: file search、参照 ID、権限分離
- human review: 対外送信前に必須

#### 例2: 障害一次トリアージ

- model 重視点: 事実抽出、分類、簡潔さ
- tool 重視点: ログ検索、監視アラート取得、チケット起票
- human review: sev 判定や対外影響は必須

#### 例3: 提案書草案作成

- model 重視点: 長文文脈理解、構成力
- tool 重視点: 過去事例検索、製品仕様参照
- human review: 商談戦略、価格、対外約束は必須

## 3.8 採用判断メモを残す

### なぜ文書化が必要か

AI の選定は、あとから「なぜこの構成にしたのか」を説明できなければ運用で困る。

- なぜその model を選んだのか
- なぜ built-in ではなく custom tool にしたのか
- なぜ human review をここに置いたのか
- なぜ benchmark より実タスク eval を優先したのか

これを口頭で済ませると、担当交代時に再現できない。

### 採用判断メモの雛形

```text
対象タスク:

候補:
- model 候補
- tool 候補
- 検索 / orchestration 構成

比較軸:
- quality
- latency
- cost
- safety
- operability

評価結果:
- offline eval
- regression eval
- workflow-level acceptance check
- human review

主なリスク:

採用判断:
- 採用 / 条件付き採用 / 不採用

再確認条件:
- model 更新時
- schema 変更時
- tool 権限変更時
- 規程変更時
```

### 再確認条件を明示する

時点依存の主張は、再確認条件とセットで残す。例:

- 長文性能に依存した設計のため、model major update 時に再評価
- built-in tool の stable 化に依存するため、API status 更新時に再確認
- 外部送信を含むため、法務・個人情報ルール変更時に再確認
- preview 機能を含むため、本番採用前に stable 版へ移行可否を確認

### この章の実務的な結論

- benchmark は候補整理に使う
- 採用判断は task definition と実タスク eval で行う
- 4つの評価レイヤを分ける
- model と tool を同じ比較表で見る
- PoC は採用判断の場にする
- 導入後も regression eval を回す

## 章末まとめ

- benchmark は有用だが補助情報であり、採用判断の中心は実タスク eval に置くべきである。
- 評価設計の出発点は task definition であり、success、failure、guardrail、human review を観測可能な形で定義する必要がある。
- offline eval / regression eval / workflow-level acceptance check / human review は役割が異なるため、分けて設計する。
- model 選定は quality だけでなく、cost、latency、structured output、tool reliability、operability、safety を含む多軸比較で行う。
- PoC は触ってみる場ではなく、仮説を検証し、採用・条件付き採用・不採用を決める場である。
- 継続評価を前提にし、本番データから regression ケースを育てることで、更新や運用 drift に耐えやすくなる。
- model と tool は分離して比較しつつ、workflow 全体で受け入れ可能かを最終判断することが重要である。

## 実務チェックリスト

- [ ] task definition を文書化した。
- [ ] success を観測可能な条件で書いた。
- [ ] failure を先に列挙した。
- [ ] guardrail を品質基準と分けて定義した。
- [ ] offline eval のデータセットを用意した。
- [ ] regression eval に高頻度・高リスク・過去失敗ケースを入れた。
- [ ] workflow-level acceptance check のシナリオを作った。
- [ ] human review の確認観点と差戻し理由を定義した。
- [ ] benchmark を shortlist の参考にとどめている。
- [ ] cost、latency、quality、safety を同じ比較表で見ている。
- [ ] tool 権限と approval flow を比較対象に含めた。
- [ ] PoC の受け入れ基準と不採用条件を決めた。
- [ ] 本番導入後の継続評価と再確認条件を決めた。

## 次に読む章・参照付録

- 第2章 [実務判断に必要な技術理解](../chapter-02/): token、context、structured output、tool use の前提に戻って確認する。
- 第6章 [知識連携とツール連携](../chapter-06/): tool design と workflow-level 評価の対象を具体化する。
- 第8章 [品質保証・リスク管理・コンプライアンス](../chapter-08/): guardrail、継続監視、リスク低減策をより広い運用観点で確認する。
- 付録A [AIエージェント実務テンプレート集](../../appendices/appendix-a/): task definition や出力契約の雛形を流用する。
- 付録B [参考文献](../../appendices/appendix-b/): 本章で参照した一次情報の source ID を確認する。
- 付録D [実務会話例集](../../appendices/appendix-d/): 評価時に比較する prompt variation を整理する。

## Source Notes

- 評価設計、grader、データセット、ground truth、継続的な eval 改善は、[OAI-EVALS](../../appendices/appendix-b/#oai-evals)、[ANT-EVALS](../../appendices/appendix-b/#ant-evals)、[NIST-AIRMF](../../appendices/appendix-b/#nist-airmf)、[NIST-GENAI](../../appendices/appendix-b/#nist-genai) を参照。
- task definition、success criteria、tool execution 形態、context handling は、[ANT-CONTEXT](../../appendices/appendix-b/#ant-context)、[ANT-TOOLS](../../appendices/appendix-b/#ant-tools)、[OAI-TOOLS](../../appendices/appendix-b/#oai-tools)、[GGL-TOOLS](../../appendices/appendix-b/#ggl-tools) を参照。
- structured output、function calling、tool integration の比較観点は、[OAI-STRUCTURED](../../appendices/appendix-b/#oai-structured)、[OAI-TOOLS](../../appendices/appendix-b/#oai-tools)、[GGL-STRUCTURED](../../appendices/appendix-b/#ggl-structured)、[GGL-FUNCTION](../../appendices/appendix-b/#ggl-function)、[GGL-TOOLS](../../appendices/appendix-b/#ggl-tools)、[MCP-SPEC](../../appendices/appendix-b/#mcp-spec)、[MCP-TOOLS](../../appendices/appendix-b/#mcp-tools) を参照。
- guardrail、人間承認、agentic risk、文書化、教育・リテラシー、個人情報配慮は、[OWASP-LLM-2025](../../appendices/appendix-b/#owasp-llm-2025)、[OWASP-AGENTIC-2026](../../appendices/appendix-b/#owasp-agentic-2026)、[OWASP-AGENTIC-MITIGATIONS](../../appendices/appendix-b/#owasp-agentic-mitigations)、[METI-AI-1-2](../../appendices/appendix-b/#meti-ai-1-2)、[PPC-GENAI](../../appendices/appendix-b/#ppc-genai)、[EU-AIACT](../../appendices/appendix-b/#eu-aiact) を参照。
- 2026-07-21 時点依存の主張は、API の stable/preview 状態、tool availability、評価機能、規制適用範囲の更新可能性を前提に記述した。model 更改、ツール追加、規程変更、外部状態変更の自動化拡大時は一次情報を再確認すること。
