# Requirements Document

## Introduction

プロジェクトマネージャー試験の学習を支援するWebベースのクイズアプリケーションを開発します。このアプリケーションは、exam_data/json配下のJSONファイルから問題データを読み込み、exam_data/images配下の画像ファイルを問題の図表として表示し、ユーザーが順次問題に回答できるクイズ形式の学習サイトです。GitHub Pagesでの公開を前提とし、データベースを使用せずフロントエンドのみで完結する設計とします。

## Requirements

### Requirement 1

**User Story:** As a プロジェクトマネージャー試験の受験者, I want 過去問題をクイズ形式で解答できる機能, so that 効率的に試験対策ができる

#### Acceptance Criteria

1. WHEN ユーザーがサイトにアクセス THEN システム SHALL exam_data/json配下の全JSONファイルから問題データを読み込む
2. WHEN 問題が表示される THEN システム SHALL 問題文、選択肢（ア、イ、ウ、エ）、問題番号を表示する
3. WHEN ユーザーが選択肢を選択 THEN システム SHALL 選択状態を視覚的に表示する
4. WHEN ユーザーが回答を確定 THEN システム SHALL 正解・不正解を即座に表示する
5. WHEN 回答確定後 THEN システム SHALL 正解の選択肢をハイライト表示する

### Requirement 2

**User Story:** As a 学習者, I want 問題に含まれる図表や画像を確認できる機能, so that 図表問題も正確に理解して回答できる

#### Acceptance Criteria

1. WHEN 問題に画像が関連付けられている THEN システム SHALL exam_data/images配下の対応する画像ファイルを表示する
2. WHEN 画像が表示される THEN システム SHALL 画像を問題文の適切な位置に配置する
3. WHEN 画像が大きい場合 THEN システム SHALL 画像サイズを適切に調整して表示する
4. IF 画像ファイルが存在しない THEN システム SHALL エラーを表示せず代替テキストを表示する

### Requirement 3

**User Story:** As a 学習者, I want 複数の試験年度・区分の問題から選択して学習できる機能, so that 幅広い範囲の問題に取り組める

#### Acceptance Criteria

1. WHEN サイトが読み込まれる THEN システム SHALL 利用可能な試験データ（年度・区分）の一覧を表示する
2. WHEN ユーザーが試験データを選択 THEN システム SHALL 選択されたデータセットの問題のみを表示する
3. WHEN 試験データが選択されていない THEN システム SHALL 全ての問題をランダムに出題する
4. WHEN 試験データを切り替える THEN システム SHALL 現在の進捗をリセットして新しいデータセットを開始する

### Requirement 4

**User Story:** As a 学習者, I want 学習の進捗状況を確認できる機能, so that 自分の学習状況を把握できる

#### Acceptance Criteria

1. WHEN 問題に回答する THEN システム SHALL 正解数・不正解数・総問題数を記録する
2. WHEN 進捗情報が更新される THEN システム SHALL 現在の正答率を計算して表示する
3. WHEN 問題セットが完了する THEN システム SHALL 最終的な成績サマリーを表示する
4. WHEN ページをリロードする THEN システム SHALL 進捗情報をブラウザのローカルストレージに保存・復元する

### Requirement 5

**User Story:** As a 学習者, I want 問題を順次進めていく機能, so that 体系的に学習を進められる

#### Acceptance Criteria

1. WHEN 回答を確定する THEN システム SHALL 「次の問題」ボタンを表示する
2. WHEN 「次の問題」ボタンをクリック THEN システム SHALL 次の問題を表示する
3. WHEN 最後の問題に到達 THEN システム SHALL 学習完了メッセージと成績サマリーを表示する
4. WHEN 学習完了後 THEN システム SHALL 「最初から始める」オプションを提供する
5. IF 前の問題に戻りたい場合 THEN システム SHALL 「前の問題」ボタンを提供する

### Requirement 6

**User Story:** As a GitHub Pagesユーザー, I want 静的サイトとして動作するアプリケーション, so that サーバー不要で簡単にアクセスできる

#### Acceptance Criteria

1. WHEN サイトがデプロイされる THEN システム SHALL GitHub Pagesで正常に動作する
2. WHEN データを読み込む THEN システム SHALL サーバーサイド処理を使用せずクライアントサイドのみで動作する
3. WHEN ファイルにアクセスする THEN システム SHALL 相対パスを使用してリソースにアクセスする
4. WHEN ブラウザでアクセスする THEN システム SHALL モダンブラウザで互換性を保つ