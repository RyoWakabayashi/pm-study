/**
 * Quiz クラス
 * クイズの進行管理とロジックを担当
 */
class Quiz {
    /**
     * クイズの初期化
     * @param {Array} questions 問題データの配列
     * @param {string} examId 試験ID
     */
    constructor(questions, examId) {
        this.questions = questions;
        this.examId = examId;
        this.currentIndex = 0;
        this.answers = [];
        this.correctCount = 0;
        this.incorrectCount = 0;
        this.startTime = new Date().toISOString();
    }

    /**
     * 現在の問題を取得
     * @returns {Object} 現在の問題
     */
    getCurrentQuestion() {
        return this.questions[this.currentIndex];
    }

    /**
     * 回答を処理
     * @param {string} selectedOption 選択された選択肢
     * @returns {Object} 回答結果
     */
    submitAnswer(selectedOption) {
        const currentQuestion = this.getCurrentQuestion();
        const isCorrect = selectedOption === currentQuestion.answer;
        
        // 正解・不正解のカウントを更新
        if (isCorrect) {
            this.correctCount++;
        } else {
            this.incorrectCount++;
        }
        
        // 回答を記録
        const answer = {
            questionNumber: currentQuestion.number,
            selected: selectedOption,
            correct: isCorrect
        };
        
        // 既に回答済みの問題の場合は上書き
        const existingAnswerIndex = this.answers.findIndex(
            a => a.questionNumber === currentQuestion.number
        );
        
        if (existingAnswerIndex !== -1) {
            // 前回の回答が正解で今回が不正解の場合
            if (this.answers[existingAnswerIndex].correct && !isCorrect) {
                this.correctCount--;
                this.incorrectCount++;
            } 
            // 前回の回答が不正解で今回が正解の場合
            else if (!this.answers[existingAnswerIndex].correct && isCorrect) {
                this.correctCount++;
                this.incorrectCount--;
            }
            
            this.answers[existingAnswerIndex] = answer;
        } else {
            this.answers.push(answer);
        }
        
        return {
            isCorrect,
            correctAnswer: currentQuestion.answer,
            selectedOption
        };
    }

    /**
     * 次の問題に進む
     * @returns {boolean} 次の問題があるかどうか
     */
    nextQuestion() {
        if (this.currentIndex < this.questions.length - 1) {
            this.currentIndex++;
            return true;
        }
        return false;
    }

    /**
     * 前の問題に戻る
     * @returns {boolean} 前の問題があるかどうか
     */
    previousQuestion() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            return true;
        }
        return false;
    }

    /**
     * 進捗情報を取得
     * @returns {Object} 進捗情報
     */
    getProgress() {
        return {
            examId: this.examId,
            currentQuestion: this.currentIndex,
            answers: this.answers,
            correctCount: this.correctCount,
            incorrectCount: this.incorrectCount,
            totalAnswered: this.answers.length,
            totalQuestions: this.questions.length,
            startTime: this.startTime,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * 進捗情報を復元
     * @param {Object} progress 進捗情報
     */
    restoreProgress(progress) {
        if (!progress) return;
        
        this.currentIndex = progress.currentQuestion || 0;
        this.answers = progress.answers || [];
        this.correctCount = progress.correctCount || 0;
        this.incorrectCount = progress.incorrectCount || 0;
        this.startTime = progress.startTime || new Date().toISOString();
    }

    /**
     * 問題をシャッフル
     */
    shuffleQuestions() {
        for (let i = this.questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.questions[i], this.questions[j]] = [this.questions[j], this.questions[i]];
        }
    }

    /**
     * 特定の問題に移動
     * @param {number} index 移動先のインデックス
     * @returns {boolean} 移動が成功したかどうか
     */
    goToQuestion(index) {
        if (index >= 0 && index < this.questions.length) {
            this.currentIndex = index;
            return true;
        }
        return false;
    }

    /**
     * 現在の問題が回答済みかどうか
     * @returns {boolean} 回答済みかどうか
     */
    isCurrentQuestionAnswered() {
        const currentQuestion = this.getCurrentQuestion();
        return this.answers.some(a => a.questionNumber === currentQuestion.number);
    }

    /**
     * 現在の問題の回答を取得
     * @returns {Object|null} 回答情報
     */
    getCurrentAnswer() {
        const currentQuestion = this.getCurrentQuestion();
        return this.answers.find(a => a.questionNumber === currentQuestion.number) || null;
    }
}