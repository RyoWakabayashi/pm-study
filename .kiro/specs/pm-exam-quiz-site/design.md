# Design Document

## Overview

プロジェクトマネージャー試験学習用Webサイトは、静的なSPA（Single Page Application）として設計されます。Vanilla JavaScript、HTML、CSSを使用し、GitHub Pagesでの公開に最適化された構成とします。データベースを使用せず、JSONファイルから問題データを読み込み、ブラウザのローカルストレージで進捗を管理します。

## Architecture

### システム構成
```
pm-exam-quiz-site/
├── index.html              # メインページ
├── css/
│   └── style.css          # スタイルシート
├── js/
│   ├── app.js             # メインアプリケーション
│   ├── quiz.js            # クイズロジック
│   ├── data-loader.js     # データ読み込み
│   └── storage.js         # ローカルストレージ管理
└── exam_data/             # 既存の試験データ
    ├── json/              # 問題データ
    └── images/            # 問題画像
```

### データフロー
1. **初期化**: アプリケーション起動時にJSONファイル一覧を取得
2. **データ読み込み**: 選択された試験データのJSONを非同期読み込み
3. **問題表示**: 問題データを解析し、画像パスを解決してUI表示
4. **回答処理**: ユーザー回答を検証し、結果を表示
5. **進捗管理**: ローカルストレージに学習状況を保存

## Components and Interfaces

### 1. DataLoader クラス
**責務**: 試験データの読み込みと管理

```javascript
class DataLoader {
  // 利用可能な試験データファイル一覧を取得
  async getAvailableExams()
  
  // 指定された試験データを読み込み
  async loadExamData(examId)
  
  // 画像パスの解決
  resolveImagePath(examId, questionNumber, option)
}
```

### 2. Quiz クラス
**責務**: クイズの進行管理とロジック

```javascript
class Quiz {
  // クイズの初期化
  constructor(questions, examId)
  
  // 現在の問題を取得
  getCurrentQuestion()
  
  // 回答を処理
  submitAnswer(selectedOption)
  
  // 次の問題に進む
  nextQuestion()
  
  // 前の問題に戻る
  previousQuestion()
  
  // 進捗情報を取得
  getProgress()
}
```

### 3. UIManager クラス
**責務**: ユーザーインターフェースの管理

```javascript
class UIManager {
  // 試験選択画面を表示
  showExamSelection(availableExams)
  
  // 問題画面を表示
  showQuestion(question, questionNumber, totalQuestions)
  
  // 回答結果を表示
  showAnswerResult(isCorrect, correctAnswer)
  
  // 進捗情報を更新
  updateProgress(current, total, correctCount)
  
  // 最終結果を表示
  showFinalResults(results)
}
```

### 4. StorageManager クラス
**責務**: ローカルストレージでの進捗管理

```javascript
class StorageManager {
  // 進捗を保存
  saveProgress(examId, progress)
  
  // 進捗を読み込み
  loadProgress(examId)
  
  // 進捗をクリア
  clearProgress(examId)
}
```

## Data Models

### ExamData モデル
```javascript
{
  id: "2022r04a_koudo_am1",
  name: "2022年度 高度区分 午前I",
  questions: [
    {
      number: "1",
      question: "問題文...",
      options: {
        "ア": "選択肢1",
        "イ": "選択肢2", 
        "ウ": "選択肢3",
        "エ": "選択肢4"
      },
      answer: "イ",
      hasImages: true,
      imagePaths: {
        "question": "exam_data/images/2022r04a_koudo_am1/q01.png",
        "ア": "exam_data/images/2022r04a_koudo_am1/q01_ア.png"
      }
    }
  ]
}
```

### Progress モデル
```javascript
{
  examId: "2022r04a_koudo_am1",
  currentQuestion: 5,
  answers: [
    { questionNumber: 1, selected: "イ", correct: true },
    { questionNumber: 2, selected: "ア", correct: false }
  ],
  correctCount: 1,
  totalAnswered: 2,
  startTime: "2025-01-21T10:00:00Z",
  lastUpdated: "2025-01-21T10:15:00Z"
}
```

## Error Handling

### 1. データ読み込みエラー
- JSONファイルが存在しない場合: エラーメッセージを表示し、利用可能な試験一覧に戻る
- JSONファイルが破損している場合: パースエラーをキャッチし、ユーザーに通知

### 2. 画像読み込みエラー
- 画像ファイルが存在しない場合: 代替テキスト「[図表]」を表示
- 画像読み込みに失敗した場合: onerrorイベントで代替表示に切り替え

### 3. ローカルストレージエラー
- ストレージ容量不足: 古い進捗データを削除して再試行
- ストレージアクセス不可: メモリ内で一時的に進捗を管理

### 4. ネットワークエラー
- GitHub Pagesでのファイルアクセス失敗: リトライ機能を実装
- CORS エラー: 相対パスでのアクセスを徹底

## Testing Strategy

### 1. 単体テスト
- **DataLoader**: 各JSONファイルの読み込み、画像パス解決
- **Quiz**: 回答処理、進捗計算、状態管理
- **StorageManager**: ローカルストレージの読み書き

### 2. 統合テスト
- **データフロー**: JSONデータ読み込みから問題表示まで
- **ユーザーフロー**: 試験選択から完了まで
- **エラーハンドリング**: 各種エラー状況での動作

### 3. ブラウザテスト
- **互換性**: Chrome, Firefox, Safari, Edgeでの動作確認
- **レスポンシブ**: モバイル・タブレット・デスクトップでの表示
- **パフォーマンス**: 大量問題データでの動作速度

### 4. GitHub Pages テスト
- **デプロイ**: 静的ファイルとしての正常動作
- **パス解決**: 相対パスでのリソースアクセス
- **HTTPS**: セキュアな環境での動作

## Implementation Considerations

### 1. 画像処理戦略
- 問題番号と選択肢から画像パスを動的生成
- 画像の存在確認とフォールバック処理
- 画像サイズの自動調整（CSS max-width: 100%）

### 2. パフォーマンス最適化
- JSONファイルの遅延読み込み
- 画像の遅延読み込み（Intersection Observer API）
- 進捗データの効率的な保存

### 3. ユーザビリティ
- キーボードナビゲーション対応
- アクセシビリティ（ARIA属性、セマンティックHTML）
- 直感的なUI/UX設計

### 4. GitHub Pages 最適化
- 相対パス使用によるポータビリティ確保
- 静的ファイルのみでの完全動作
- SEO対応（meta tags, structured data）