---
title: "第8章：品質保証・リスク管理・コンプライアンス"
chapter: chapter08
layout: book
order: 10
---

# 第8章：品質保証・リスク管理・コンプライアンス

## この章の使い方

### 誰向け

- AIエージェントや生成AIを本番運用へ載せる前に、quality gateとrisk controlを整えたい担当者
- human review、monitoring、auditability、incident responseを業務設計へ埋め込みたい運用責任者
- セキュリティ、プライバシー、法務、監査との責任分界を整理したい設計者
- 規制やガイダンスを「何となく守る」ではなく、どのjurisdictionで何に使うかを区別したい読者

### この章でできるようになること

- task acceptanceとworkflow acceptanceを分けて定義できる
- monitoring、human review、auditability、incident対応を運用契約として設計できる
- `prompt injection`、`insecure output handling`、`data leakage`、`excessive autonomy` を主要riskとして整理できる
- 監査ログに必要な保持期間、access control、masking、削除、incident保全、監査責任者を定義できる
- NIST、OWASP、METI、PPC、EU AI Actを、法令、任意framework、guidanceに分けて説明できる

### 最短ルート

1. [8.1 qualityの受入条件を定義する](#81-qualityの受入条件を定義する)
2. [8.2 monitoringとhuman-reviewを設計する](#82-monitoringとhuman-reviewを設計する)
3. [8.3 主要riskを4類型で扱う](#83-主要riskを4類型で扱う)
4. [8.4 auditabilityと監査ログを設計する](#84-auditabilityと監査ログを設計する)
5. [8.6 法令frameworkguidanceを分けて使う](#86-法令frameworkguidanceを分けて使う)

### 深掘りルート

- 第6章で扱ったTool Contract、Permission Matrix、loggingを先に見直すと、本章のcontrol設計が具体化しやすい
- 第7章のRACI、KPI、変更管理、教育計画を作ってから本章へ来ると、統制の配置先が明確になる
- 付録Bのsource noteと併読し、どの主張が法令で、どれが任意frameworkかを都度確認する
- incident Runbookや監査ログ要件を作る際は、付録Cの成果物テンプレートへ落とし込む

本章は、品質を上げる技法集ではありません。
本番運用で「止める」「残す」「説明する」を実行できる状態を作る章です。
技術的に動くことと、運用上説明できることは別です。
後者がないと、導入は長続きしません。

> 本章の内容は一般的な実務設計の整理であり、法的助言ではありません。
> 法令適用、契約解釈、個別案件の適法性判断は、自組織の法務、コンプライアンス、監督当局向けの一次資料確認へ戻ってください。

## 8.1 qualityの受入条件を定義する

### task acceptanceとworkflow acceptanceを分ける

AI導入では、単発出力の良し悪しと、業務全体として安全に回るかを分けて評価する必要があります。
本章では、次の2層で受入条件を置きます。

- task acceptance: 個々の回答、要約、分類、レビュー案が満たすべき条件
- workflow acceptance: 人間、tool、approval、loggingを含む全体運用が満たすべき条件

task acceptanceだけを見ると、局所的に正しいが、運用として危険なsystemを見逃します。
workflow acceptanceだけを見ると、統制は強いが、役に立たないsystemを見逃します。
両方が必要です。

### task acceptanceに入れる項目

次の項目を、業務ごとに明文化します。

- 出力形式
- 根拠表示の要否
- 禁止事項
- no-answer条件
- 不確実性の表示方法
- 人手確認が必要な条件
- 機密情報や個人情報の扱い

例として、社内規程回答なら次のようになります。

| 項目 | 例 |
| --- | --- |
| 出力形式 | 結論、根拠条項、適用条件、要確認点 |
| 根拠表示 | 条項リンクまたは条項名を必須にする |
| 禁止事項 | 個別法務判断を断定しない |
| no-answer | 根拠不在、権限不足、版競合 |
| 不確実性 | 「要確認」節で明示する |
| 人手確認 | 個別事情、例外承認、未公開情報 |

### workflow acceptanceに入れる項目

workflow acceptanceでは、出力そのものではなく、運用契約を確認します。
最低限、次を見ます。

- 正本sourceだけを参照すること
- 権限外dataへ到達しないこと
- approvalが必要な操作で自動進行しないこと
- ログがrequest単位で追跡可能であること
- incident時に停止、保全、連絡が実行できること
- 変更時に再評価と周知が行われること

この層では、モデル評価だけでなく、workflowの「境界」が主題です。
評価観点はSRE、security、privacy、監査を含む横断チームで決めます。

### 受入条件を文書化する単位

受入条件は、次の単位で持つと管理しやすくなります。

- ユースケース定義書
- Eval Spec
- Tool Contract
- approval policy
- incident Runbook
- ログ要件

受入条件を1つの長文へ詰め込むと、更新のたびに破綻します。
成果物ごとに責任者を分け、変更時に再承認できる形へ分解します。

### negative caseを先に作る

受入条件は、成功例だけでは作れません。
次のようなnegative caseを先に用意します。

- 根拠がないのに断定する
- 古い版のsourceを根拠にする
- 権限外の情報を回答へ含める
- 指示に見える外部contentへ従う
- approval前に外部送信や状態変更を進める

negative caseは、運用中の健全性チェックにも使えます。
本番利用開始後も、定期的に再実行して挙動の変化を確認します。

### 受入証跡パッケージ

受入条件は、満たしたと言うだけでは不十分です。
どの証跡で満たしたかを一緒に残します。

最低限、次の束を1セットで保管します。

- 要件一覧
- 評価入力例
- 成功例と失敗例
- 実行結果
- reviewerコメント
- 未解決risk
- 本番開始の承認記録

この束があると、後から「どの前提で利用開始したか」を確認できます。
特に、後続変更で挙動が変わったとき、回帰の起点として使えます。

## 8.2 monitoringとhuman reviewを設計する

### monitoringは性能監視だけではない

AI運用のmonitoringは、応答時間やエラー率だけを見ればよいわけではありません。
次の4層で考えます。

- availability: 落ちていないか
- quality: 根拠不足、no-answer、差し戻しが増えていないか
- safety: 権限逸脱、mask漏れ、危険出力がないか
- governance: source未更新、未承認変更、保存違反がないか

この4層を分けると、技術運用と業務運用を一緒にし過ぎずに済みます。

### monitoring項目の例

| 層 | 項目 |
| --- | --- |
| availability | タイムアウト、失敗率、依存service異常 |
| quality | 根拠欠落率、review差し戻し率、no-answer率 |
| safety | policy違反検知、権限外要求、危険操作提案 |
| governance | source版ズレ、未承認変更、保持期間超過ログ |

すべてをリアルタイム監視する必要はありません。
重要なのは、どの項目を即時検知し、どの項目を定期レビューへ回すかを分けることです。

### human reviewを置く場所

human reviewは、最後に全部見る運用より、危険度に応じて置く方が現実的です。
代表的な配置先は次の通りです。

- 高risk回答の公開前
- 外部送信前
- 本番変更前
- 権限拡大前
- source更新反映前
- incident後の再開前

reviewerには、「どこを見ればよいか」が必要です。
AIの全文を読み込ませるのではなく、確認観点を固定します。

### human reviewの観点例

- 根拠sourceは正しいか
- 条項や差分の読み違いがないか
- 個別判断を断定していないか
- 出力が実行可能か
- 危険な副作用を誘発しないか
- approvalが必要な範囲を越えていないか

review観点を定義しないと、reviewは気合いに依存します。
人手レビューを置いても、品質保証にならない典型です。

### reviewerの負荷を測る

human reviewは安全策ですが、無制限には置けません。
次の項目を測ります。

- 1件あたりreview時間
- 差し戻し率
- review理由の分類
- reviewer間の判断差
- review待ち滞留

この値が増え続けるなら、AIの改善だけでなく、対象scopeや出力形式の見直しが必要です。
reviewを増やすほど安全になるとは限りません。

### reviewerの校正

reviewerが複数いる場合は、同じ出力に対する判断の差を確認します。
校正で見たいのは、厳しさの差ではなく、基準のずれです。

- どの失敗を重大とみなすか
- no-answerを許容するか
- 根拠不足と表現の粗さをどう区別するか
- approvalへ上げる条件が一致しているか

校正は、定例会議でサンプルを見ながら行うと実務に乗せやすくなります。
reviewerごとの暗黙知を減らすことが、運用品質の安定化につながります。

### alertとescalationの分離

monitoringでは、検知と判断を分けます。

- alert: 異常の可能性を知らせる
- escalation: 人が判断すべき案件として回す

たとえば、権限外sourceへのアクセス試行は即alert対象です。
一方で、no-answer率の上昇は週次reviewで十分な場合もあります。
同じ運用板にすべて載せると、重要事象が埋もれます。

## 8.3 主要riskを4類型で扱う

### `prompt injection`

`prompt injection` は、利用者入力や外部contentが、systemの意図しない指示として解釈されるriskです。
RAG、web取得、添付ファイル要約、メール処理、MCP連携では特に重要です。

典型例は次の通りです。

- 取得した文書内の命令文に従う
- webページ内の隠れた指示を実行する
- 添付ファイルの本文にある誘導で権限外操作を提案する
- review対象PRの本文にある命令をsystem instructionより優先する

最低限の対策は次の通りです。

- 信頼できるsourceと外部contentを区別する
- retrieved contentを命令ではなくdataとして扱う
- tool実行前にschema validationとauthorizationを行う
- 高risk操作にhuman approvalを置く
- `prompt injection` をnegative caseへ入れる

RAGやfine-tuningは、このriskを自動で解消しません。
第6章で扱ったtool境界とapproval境界を維持することが重要です。

### `insecure output handling`

`insecure output handling` は、AI出力を十分な検証なしで実行、送信、保存、表示してしまうriskです。
問題は「AIが間違うこと」よりも、「間違った出力をsystemがそのまま扱うこと」にあります。

典型例は次の通りです。

- 生成したコマンドをそのまま実行する
- HTMLやMarkdownの出力を無加工で公開する
- 生成した設定値を型検証なしで本番へ流す
- review案を承認済みと誤解して変更へ進める

最低限の対策は次の通りです。

- 出力schemaを固定する
- semantic validationを別層で実行する
- 実行可能出力と説明用出力を分ける
- 外部送信前と状態変更前にapprovalを置く
- renderingやscript実行の境界を制御する

`insecure output handling` は、tool integrationが増えるほど重要になります。
「正しい形式で返った」ことと「安全に使える」ことを分けてください。

### `data leakage`

`data leakage` は、入力、出力、ログ、外部連携、権限誤設定を通じて、秘匿すべきdataが露出するriskです。
個人情報、営業秘密、未公開設計、認証情報だけでなく、system promptや内部構造の露出も含みます。

典型例は次の通りです。

- 利用者が個人情報を不用意に入力する
- 権限外documentの要約が混入する
- ログへ平文の機密情報が残る
- 外部SaaSへ許可なくdataを送信する
- tool error messageが内部構成を露出する

最低限の対策は次の通りです。

- 入力前に禁止dataと許容dataを明示する
- sourceにACLと分類を持たせる
- ログでmaskingを行う
- 外部送信境界と保存先を定義する
- 削除要求、保持期間、incident保全を分けて扱う

`data leakage` は、利用者教育だけでは防げません。
system側で送信、保存、表示の境界を制御する必要があります。

### `excessive autonomy`

`excessive autonomy` は、systemに与える権限、判断範囲、連続実行能力が、業務統制やrisk許容度を超えてしまう状態です。
エージェント化が進むほど、便利さと同時にこのriskが増えます。

典型例は次の通りです。

- approvalなしで複数toolを連鎖実行する
- 目的達成のために、想定外の代替手段を勝手に選ぶ
- 失敗時retryを繰り返し、被害範囲を広げる
- 設定変更、送信、削除を一括で進める

最低限の対策は次の通りです。

- least privilege
- tool allowlist
- stepごとのapproval gate
- 実行回数、時間、scopeの上限
- 停止条件とkill switch
- multi-agent化の前にsingle-agentで評価する

自律性を高める判断は、利便性だけで決めません。
監査、incident、責任分界まで含めて採否を決めます。

### 4類型を横断で扱う

4類型は独立ではありません。
多くの事故では、複数が同時に起きます。

- `prompt injection` が起点となり、`insecure output handling` で実行される
- `data leakage` を防ぐmask不足が、incident時の説明責任も弱める
- `excessive autonomy` が、誤出力の影響範囲を広げる

そのため、risk registerでは1件ずつ孤立させず、起点、伝播、検知、停止、保全をつなげて記録します。

## 8.4 auditabilityと監査ログを設計する

### auditabilityの定義

auditabilityとは、後から見たときに、何が起きたかを説明できる性質です。
単なるログ保存ではありません。
少なくとも、次の問いに答えられる必要があります。

- 誰が何を依頼したか
- どのsourceと版を参照したか
- どのtoolを呼んだか
- どの出力が作られたか
- 誰が承認したか
- 何が本番反映されたか
- incident時に何を保全したか

### 監査ログの最小項目

| 項目 | 理由 |
| --- | --- |
| request_id | 追跡の起点 |
| 実行日時 | 時系列再現 |
| 実行主体 | 利用者、service account、reviewer識別 |
| ユースケース識別子 | どのworkflowか判別 |
| source version | 根拠の再現 |
| tool call記録 | 副作用の追跡 |
| output summary | 全文保存が不要な場合の要約 |
| approval record | 誰がどこで承認したか |
| policy hit | no-answer、mask、blockの履歴 |
| change version | prompt、tool、workflowの版 |

全文保存の是非は、法令、契約、privacy要件、incident要件で変わります。
最小項目を固定し、その上で本文保存の範囲を決めます。

### 保持期間を決める

保持期間は、長ければ安全というものではありません。
長期保存は、漏えい面積と運用コストを増やします。
一方で短すぎると、監査やincident調査に耐えません。

保持期間では次を整理します。

- 通常ログの保持期間
- 監査記録の保持期間
- incident関連記録の保全期間
- バックアップの保持期間
- 削除要求時の扱い

具体的な期間は、自組織の法令、契約、内部規程に従って決めてください。
本書では固定値を示しません。
期間を決めたら、どのrecord typeに適用するかまで書きます。

### access control

監査ログは、集めるだけでなく、誰が見られるかを制御する必要があります。
次の原則を守ります。

- 利用者は自分に必要な範囲だけ閲覧
- 運用ownerは障害対応に必要な範囲だけ閲覧
- security / privacy担当は調査に必要な範囲だけ閲覧
- 監査責任者は監査目的の範囲で閲覧
- 管理者であっても全文アクセスを常態化しない

ログ閲覧自体も記録対象です。
誰がいつどの監査ログを見たかを残します。

### masking（マスキング）

ログやレビュー画面では、原文をそのまま保持しない設計が重要です。
masking（マスキング）対象の例は次の通りです。

- 個人情報
- 認証情報
- 秘密鍵、token
- 顧客識別子
- 機微な内部名称

maskingは万能ではありません。
incident調査や法令上の保存が必要な場合は、原本保全との両立を設計します。
その場合も、平常時閲覧面ではmask済み表示を優先します。

### 削除

削除は、単にcronで消すだけでは不十分です。
次を定義します。

- 通常削除の手順
- 保持期間満了時の削除責任者
- 削除失敗時の検知
- incident保全中の削除停止
- バックアップからの消去または失効方針

特に、incident保全と通常削除の競合は先に整理してください。
保全指示が出たrecordは、通常削除フローから除外される必要があります。

### incident保全

incident発生時には、通常運用より保全を優先します。
次の記録を凍結できるようにします。

- requestとresponseの関連記録
- tool call記録
- approval record
- source version情報
- change history
- alert履歴
- ログ閲覧履歴

保全対象と保全開始条件はRunbookで定義します。
運用現場が迷わないよう、監査責任者またはincident commanderの指示系統も書きます。

### 監査責任者

監査ログのowner不在はよくある欠陥です。
最低限、監査責任者には次の責任を置きます。

- 必須記録の定義
- 追跡テストの実施
- 保持、閲覧、削除ルールの確認
- incident保全手順の確認
- 定期監査の論点整理

監査責任者は、すべてを実装する人ではありません。
しかし、何をもって説明責任を果たすかを決めるownerは必要です。

### 監査ドリル

監査可能化は、本番監査の当日だけ確認しても遅いです。
四半期または半期ごとに、次の観点でドリルを行います。

- 任意のrequestから根拠sourceまで辿れるか
- 承認者と承認時点が確認できるか
- 変更履歴から影響範囲を特定できるか
- incident保全フラグが削除処理を止めるか
- 監査責任者が必要資料へ制限時間内に到達できるか

監査ドリルの結果は、単なる点検記録ではなく、改善バックログへ戻します。
「記録はあるが取り出せない」状態を早めに見つけることが目的です。

## 8.5 incident対応を運用へ埋め込む

### incidentの定義を決める

AI運用では、model failureだけをincidentとして扱うと不十分です。
次のような事象も含めます。

- 誤答の継続発生
- 権限外参照
- 機密情報や個人情報の露出疑い
- approval bypass
- 危険な自動実行
- ログ欠損や追跡不能

定義が曖昧だと、重大事象が「仕様」や「ユーザー操作ミス」として流されます。

### 初動でやること

初動Runbookでは、次を順に行います。

1. 影響範囲の推定
2. 実行停止または機能制限
3. 保全指示
4. 関係者連絡
5. 一時回避策の適用
6. 外部連絡要否の確認

AI固有の注意点は、再現条件がprompt、source、tool、policy versionの組み合わせで変わることです。
そのため、原因究明前に保全対象を狭め過ぎないよう注意します。

### 調査で見るもの

- request / responseの連鎖
- source version
- tool call順序
- approval record
- policy hitの有無
- 直前変更
- 同種事象の既往

incident調査では、出力本文だけ見ても原因が分からないことがあります。
workflow全体のtraceを追う前提で記録を残します。

### 復旧と再開条件

再開条件は、停止条件と同じくらい重要です。
次を明文化します。

- 原因仮説
- 暫定対策
- 再発防止策の反映確認
- reviewer追加やscope縮小の有無
- 監査責任者または業務ownerの再開承認

暫定対策だけで再開し、後で恒久対策が抜けることは珍しくありません。
再開時には、follow-upのownerと期限も残します。

### post-incident review

incident後は、単にpromptを直して終わりにしません。
次を振り返ります。

- 受入条件に欠けていた点
- monitoringで検知できたか
- human reviewの配置は適切だったか
- ログは十分だったか
- 教育や変更管理に穴がなかったか

この振り返りは、第7章の変更管理とKPI契約へ戻します。
incidentは例外対応ではなく、統制設計の改善材料です。

### 対内・対外連絡の境界

incident時は、技術対応と同時に連絡判断も必要です。
次の境界を事前に決めます。

- 利用部門への一次連絡条件
- 経営層への報告条件
- 委託先やproviderへの連絡条件
- 顧客や利用者への通知要否の判断経路
- 法務、privacy、監督当局対応へ上げる条件

この境界がないと、過少報告か過剰報告のどちらかに振れます。
法的助言ではない前提で、連絡判断の入口だけでもRunbook化してください。

## 8.6 法令・framework・guidanceを分けて使う

### 分けて考える理由

実務では、法令、任意framework、業界guidance、監督機関の注意喚起が混在して参照されます。
これを区別しないと、義務と推奨、法域内適用と参考利用が混ざります。

本章では、次の3分類で扱います。

- 法令
- 任意framework
- guidance

### 任意framework

#### NIST AI RMF

- 区分: 任意framework
- jurisdiction: 米国NISTによる公的framework。法令ではない
- status: AI RMF 1.0は2023-01-26公開。2026-07-21時点でNISTは追加profileも提供している
- intended use: Govern / Map / Measure / Manageで、組織のAI risk management全体を整理する

NIST AI RMFは、法的義務を直接定めるものではありません。
ただし、社内統制やrisk registerの骨格を作る用途に有効です。
第7章の導入段階、第8章のmonitoring、incident、auditabilityに接続しやすい構造を持ちます。

#### NIST Generative AI Profile

- 区分: 任意profile
- jurisdiction: 米国NISTによる公的profile。法令ではない
- status: NIST AI 600-1、2024-07-26公開。2026-07-21時点でも参照可能
- intended use: 生成AI固有riskをAI RMFへ接続し、downstream影響やincident communicationまで含めて整理する

生成AI特有のriskやactor連鎖を補足するため、AI RMF本体だけでは不足しやすい論点を補えます。

### guidance

#### OWASP Top 10 for LLM Applications 2025

- 区分: 業界security guidance
- jurisdiction: グローバルな任意参照。法的拘束力はない
- status: 2025版。2026-07-21時点で `prompt injection` を含むリスク分類が公開されている
- intended use: LLM / GenAI applicationの攻撃面を整理し、最低限のcontrol設計に使う

OWASPは法令ではありません。
しかし、`prompt injection` や output handlingのように、技術設計へ直結する観点を整理するのに向いています。

#### OWASP Top 10 for Agentic Applications 2026

- 区分: 業界security guidance
- jurisdiction: グローバルな任意参照。法的拘束力はない
- status: 2026版。2026-07-21時点でagentic AI向けのframeworkとして公開されている
- intended use: `excessive autonomy`、tool misuse、identity、memory、multi-agent境界など、agentic systemのsystemic riskを整理する

エージェント化されたworkflowでは、LLM単体のrisk分類だけでは不十分です。
権限、連続実行、承認回避の観点を補うために参照します。

#### OWASP Agentic AI Threats and Mitigations

- 区分: 業界security guidance
- jurisdiction: グローバルな任意参照。法的拘束力はない
- status: OWASP GenAI Security Projectの現行resourceとして2026-07-21時点で参照可能
- intended use: least privilege、approval、sandbox、monitoring、recoveryの具体化

Top 10で論点を洗い出し、このresourceでcontrolの形へ落とす使い方が実務向きです。

#### METI AI事業者ガイドライン 第1.2版

- 区分: 日本政府のguidance
- jurisdiction: 日本でAI開発、提供、利用に関わる事業者向けの行政ガイダンス
- status: 第1.2版。METI掲載ページは2026-04-01更新、2026-07-21時点で最新版として公開
- intended use: AI開発者、提供者、利用者の役割、governance、literacy、risk-based approachの整理

法令そのものではありませんが、日本の事業者が組織運用を設計するうえで、役割と体制を整理しやすい資料です。
第7章のRACI、教育、変更管理との相性がよいです。

#### PPCの生成AI利用に関する注意喚起

- 区分: 日本の監督機関による注意喚起
- jurisdiction: 日本の個人情報保護法制の文脈で、生成AI利用時の留意点を示す
- status: 2023-06-02公表。2026-07-21時点でも注意喚起ページと資料が参照可能
- intended use: 個人情報を含むprompt入力、利用目的、providerによる取扱い確認の注意点を把握する

これは一般論としての安全策ではなく、個人情報を扱う実務での注意喚起です。
入力可否や外部送信境界を決める際の起点にします。

#### PPC 法令・ガイドライン等インデックス

- 区分: 日本の法令・guideline参照口
- jurisdiction: 日本の個人情報保護法、政令、規則、guideline、Q&A等
- status: 2026-07-21時点で現行情報への公式インデックスとして公開
- intended use: 個人情報、個人データ、第三者提供、越境移転、保存、漏えい対応などの一次資料へ戻る

注意喚起だけで結論を出さず、適用判断が必要なときはこの参照口から一次資料へ戻ります。

### 法令

#### EU AI Act

- 区分: EU法令
- jurisdiction: EU域内市場での提供、流通、利用など、法令上の適用条件を満たすactorに関係する
- status: Regulation (EU) 2024/1689。2024-08-01発効。2026-07-21時点では段階適用の途中であり、2026-08-02の広範な適用開始はまだ未来日である
- intended use: actor、system分類、適用日、義務、執行主体を整理し、どの組織にどの規定が掛かるかを判断する

2026-07-21時点で、欧州委員会の公式ページでは次の timeline が示されています。

- prohibited AI practices と AI literacy obligations は 2025-02-02 から適用
- governance rules と GPAI model obligations は 2025-08-02 から適用
- AI Act全体の広範な適用は 2026-08-02 から
- 一部の high-risk AI system はさらに後ろの日付で適用される

したがって、2026-07-21時点で「すべての義務が既に全面適用されている」と扱うのは誤りです。
自組織がEU域内のprovider、deployer、importer、distributor等に該当するか、またsystem分類が何かを個別に確認する必要があります。

### 使い分けの実務ルール

- 法令は、適用性、義務、期限、記録要件の確認に使う
- 任意frameworkは、risk管理の全体設計に使う
- guidanceは、攻撃面、control、運用論点の補助に使う
- 迷ったら、法令または監督機関資料へ戻る

### 参照先の選び分け表

| 迷いどころ | 最初に見るもの | 次に確認するもの |
| --- | --- | --- |
| 組織全体のrisk管理設計 | NIST-AIRMF | NIST-GENAI, METI-AI-1-2 |
| `prompt injection` や agentic risk | OWASP-LLM-2025, OWASP-AGENTIC-2026 | OWASP-AGENTIC-MITIGATIONS |
| 日本の個人情報入力可否 | PPC-GENAI | PPC-LEGAL, 自組織規程 |
| EUでの適用性や期限 | EU-AIACT | 欧州委員会の実装guidance |
| tool連携の境界 | MCP-TOOLS | 第6章のPermission / Tool Contract |

「OWASPで推奨されているから法令順守」とは言えません。
逆に、法令に明文がなくても、OWASPやNISTの観点が内部統制として有効なことはあります。

## 8.7 実践例：社内ナレッジ問い合わせ支援のquality / risk control

### task acceptance

- 回答は結論、根拠条項、適用条件、要確認点で構成する
- 根拠がない場合は回答を断定しない
- 権限外や未公開資料を使わない
- 個別判断が必要なら担当窓口へ回す

### workflow acceptance

- 有効版規程だけを検索対象にする
- ACLに合わないdocumentは取得しない
- ticket送信前に人が確認する
- request、source version、approvalを追跡できる

### monitoring

- 条項なし回答率
- no-answer率
- 規程改定後の反映遅延
- 個人情報入力検知件数
- 担当窓口へのエスカレーション滞留

### human review

- 法務判断、人事裁量、例外承認は担当者が確認する
- 規程改定直後は回答例を抜き取りreviewする
- no-answer急増時はsource更新漏れを確認する

### 想定incident

- 旧版規程に基づく誤案内
- 個人情報を含む質問のログ残存
- 権限外文書の引用
- 質問文に含まれた指示による `prompt injection`

### 再発防止の方向

- source版管理強化
- 入力前警告の改善
- 権限filter見直し
- review対象条件の再設定
- 教育資料の更新

## 8.8 実践例：ソフトウェアリリース変更レビューのquality / risk control

### task acceptance

- 変更概要、影響範囲、要確認点、rollback観点を含む
- 参照差分やRunbookが欠ける場合は明示する
- 承認可否をAIが断定しない
- 設定変更やschema変更のriskを分類する

### workflow acceptance

- review対象repositoryと文書を固定する
- 本番変更や送信はapproval前に行わない
- review出力と人間の判断を分けて記録する
- 反映後の結果をreview traceへ接続する

### monitoring

- review差し戻し率
- 事前指摘の採用率
- 反映後incidentとの相関
- rollout前チェックの欠落件数
- approval bypass検知件数

### human review

- 本番承認者はAI出力ではなく証跡を確認する
- 緊急変更ではreview簡略化の理由を記録する
- schema変更、権限変更、migrationは重点review対象にする

### 想定incident

- 差分本文に含まれる命令文による `prompt injection`
- 生成したコマンド案をそのまま使う `insecure output handling`
- 秘匿設定値の露出による `data leakage`
- AIレビューに過信し、本来の承認を省く `excessive autonomy`

### 再発防止の方向

- review checklistの強化
- 実行可能出力の分離
- 秘匿値のmask強化
- 承認ゲートの固定
- incident由来ruleの追加入力

## 8.9 実装前に確認したい境界

### legal adviceではない境界

本章で扱う法令、framework、guidanceは、運用設計の論点整理に使うものです。
個別の適法性、契約上の責任分担、監督当局対応、越境移転の適否、雇用法や労務判断までは、本章だけで確定できません。

次の場面では、自組織の法務、privacy、compliance担当へ戻ってください。

- 個人情報や機微情報を外部providerへ送る
- EU域内でprovider / deployerとして事業展開する
- 監査証跡を法定記録として利用する
- AI出力を人事、法務、信用判断などの重要判断へ使う
- 委託先やSaaSとの契約責任が関わる

### 本章で覚えておきたい実務原則

- qualityはtask acceptanceとworkflow acceptanceに分ける
- monitoringはavailabilityだけでなく、quality、safety、governanceを含める
- human reviewは危険度の高い位置へ集中させる
- `prompt injection`、`insecure output handling`、`data leakage`、`excessive autonomy` を基幹riskとして扱う
- auditabilityは、保持、閲覧、masking、削除、incident保全、責任者まで含めて設計する
- 法令、任意framework、guidanceを混同しない

## 章末まとめ

- 本番運用のquality保証では、task acceptanceとworkflow acceptanceの両方が必要である
- monitoring、human review、approval、logging、incident対応を別々にせず、1つの運用契約として扱う
- `prompt injection`、`insecure output handling`、`data leakage`、`excessive autonomy` は、生成AIとagentic workflowの主要riskとして継続的に評価する
- 監査ログでは、保持期間、access control、masking、削除、incident保全、監査責任者を先に決める
- NISTは任意framework、OWASPとMETI・PPC資料はguidance、EU AI Actは法令として使い分ける
- 2026-07-21時点でEU AI Actは段階適用の途中であり、全面適用済みと決めつけない

## 実務チェックリスト

- [ ] task acceptanceとworkflow acceptanceを別々に定義した
- [ ] negative caseに `prompt injection`、権限外参照、approval bypass を入れた
- [ ] monitoring項目をavailability、quality、safety、governanceに分けた
- [ ] human reviewを置く場所、観点、review負荷の測定方法を定義した
- [ ] `insecure output handling` を防ぐschema validation、semantic validation、approval条件がある
- [ ] `data leakage` を防ぐ入力制御、ACL、masking、保存境界、削除手順がある
- [ ] `excessive autonomy` を防ぐleast privilege、allowlist、停止条件、kill switchがある
- [ ] 監査ログの保持期間、access control、masking、削除、incident保全、監査責任者を定義した
- [ ] incidentの定義、初動、保全、再開条件、post-incident reviewをRunbook化した
- [ ] 法令、任意framework、guidanceの区別を、社内説明資料に反映した

## 次に読む章・参照付録

- 導入段階、RACI、KPI、変更管理に戻る: [第7章](../chapter-07/)
- work unit、gate、review completenessを見直す: [第5章](../chapter-05/)
- tool、permission、logging境界を見直す: [第6章](../chapter-06/)
- Eval Spec、Runbook、incident templateを使う: [付録A](../../appendices/appendix-a/)
- sourceの対象version/status、jurisdiction、再確認条件を確認する: [付録B](../../appendices/appendix-b/)
- ADR / PR / Runbook / Postmortemへ落とす: [付録C](../../appendices/appendix-c/)
- 実務会話の例を参照する: [付録D](../../appendices/appendix-d/)

## Source Notes

- [NIST-AIRMF](../../appendices/appendix-b/#nist-airmf): 任意frameworkとしてのGovern / Map / Measure / Manage
- [NIST-GENAI](../../appendices/appendix-b/#nist-genai): 生成AI固有risk、incident、downstream影響の整理
- [OWASP-LLM-2025](../../appendices/appendix-b/#owasp-llm-2025): `prompt injection` を含むLLM application risk
- [OWASP-AGENTIC-2026](../../appendices/appendix-b/#owasp-agentic-2026): agentic systemの主要risk、特に `excessive autonomy`
- [OWASP-AGENTIC-MITIGATIONS](../../appendices/appendix-b/#owasp-agentic-mitigations): least privilege、approval、monitoring、recoveryの具体化
- [METI-AI-1-2](../../appendices/appendix-b/#meti-ai-1-2): 日本のAI事業者向けgovernanceとliteracy
- [PPC-GENAI](../../appendices/appendix-b/#ppc-genai): 生成AI利用時の個人情報取扱いに関する注意喚起
- [PPC-LEGAL](../../appendices/appendix-b/#ppc-legal): 日本の法令・guidelineへの参照口
- [EU-AIACT](../../appendices/appendix-b/#eu-aiact): EU法令としてのstatus、applicability、timeline
- [MCP-TOOLS](../../appendices/appendix-b/#mcp-tools): tool schema、result、human-in-the-loop境界
- 対象version/status、jurisdiction、意図した用途、再確認条件は付録Bに記録。最終確認: 2026-07-21
