/**
 * アプリケーションのメインスクリプト
 */
document.addEventListener('DOMContentLoaded', () => {
    // 必要なクラスのインスタンスを作成
    const dataLoader = new DataLoader();
    const storageManager = new StorageManager();
    
    // DOM要素
    const examSelectionSection = document.getElementById('exam-selection');
    const examListContainer = document.getElementById('exam-list');
    const startRandomButton = document.getElementById('start-random');
    const quizContainer = document.getElementById('quiz-container');
    const finalResultsSection = document.getElementById('final-results');
    
    const questionNumberElement = document.getElementById('question-number');
    const examInfoElement = document.getElementById('exam-info');
    const questionTextElement = document.getElementById('question-text');
    const questionImagesElement = document.getElementById('question-images');
    const optionsContainer = document.getElementById('options');
    const answerResultElement = document.getElementById('answer-result');
    const resultMessageElement = document.getElementById('result-message');
    const correctAnswerElement = document.getElementById('correct-answer');
    
    const correctCountElement = document.getElementById('correct-count');
    const incorrectCountElement = document.getElementById('incorrect-count');
    const accuracyRateElement = document.getElementById('accuracy-rate');
    
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const restartButton = document.getElementById('restart-button');
    const restartQuizButton = document.getElementById('restart-quiz');
    
    const finalCorrectCountElement = document.getElementById('final-correct-count');
    const finalIncorrectCountElement = document.getElementById('final-incorrect-count');
    const finalTotalCountElement = document.getElementById('final-total-count');
    const finalAccuracyRateElement = document.getElementById('final-accuracy-rate');
    
    // 現在のクイズインスタンス
    let currentQuiz = null;
    let selectedExamId = null;
    
    /**
     * アプリケーションの初期化
     */
    async function initApp() {
        try {
            // ローディング表示
            showLoading('アプリケーションを初期化しています...');
            
            // 利用可能な試験データを取得
            const availableExams = await dataLoader.getAvailableExams();
            
            // 試験選択画面を表示
            displayExamSelection(availableExams);
            
            // イベントリスナーを設定
            setupEventListeners();
            
            // 最後のセッションを復元
            restoreLastSession();
            
            // ローディング非表示
            hideLoading();
        } catch (error) {
            console.error('アプリケーションの初期化に失敗しました:', error);
            hideLoading();
            showErrorMessage('アプリケーションの初期化に失敗しました', error.message);
        }
    }
    
    /**
     * エラーメッセージを表示
     * @param {string} title エラータイトル
     * @param {string} message エラーメッセージ
     */
    function showErrorMessage(title, message) {
        // 既存のエラーメッセージがあれば削除
        const existingError = document.getElementById('error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // エラーメッセージ要素を作成
        const errorElement = document.createElement('div');
        errorElement.id = 'error-message';
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'assertive');
        
        // エラーコンテンツを作成
        errorElement.innerHTML = `
            <div class="error-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
            </div>
            <div class="error-content">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="error-actions">
                    <button id="retry-button" class="btn btn-primary">再試行</button>
                    <button id="dismiss-error" class="btn">閉じる</button>
                </div>
            </div>
        `;
        
        // エラーメッセージを表示
        document.body.appendChild(errorElement);
        
        // イベントリスナーを設定
        document.getElementById('retry-button').addEventListener('click', () => {
            errorElement.remove();
            window.location.reload();
        });
        
        document.getElementById('dismiss-error').addEventListener('click', () => {
            errorElement.remove();
        });
    }
    
    /**
     * 試験選択画面を表示
     * @param {Array} exams 利用可能な試験データ
     */
    function displayExamSelection(exams) {
        examListContainer.innerHTML = '';
        
        // 試験データをカテゴリ分け
        const categorizedExams = {
            '2024年度': [],
            '2023年度': [],
            '2022年度': []
        };
        
        exams.forEach(exam => {
            const yearMatch = exam.name.match(/(\d{4})年度/);
            if (yearMatch) {
                const year = yearMatch[1] + '年度';
                if (categorizedExams[year]) {
                    categorizedExams[year].push(exam);
                } else {
                    categorizedExams[year] = [exam];
                }
            } else {
                if (!categorizedExams['その他']) {
                    categorizedExams['その他'] = [];
                }
                categorizedExams['その他'].push(exam);
            }
        });
        
        // カテゴリごとに表示
        Object.entries(categorizedExams).forEach(([category, categoryExams]) => {
            if (categoryExams.length === 0) return;
            
            const categoryHeader = document.createElement('h3');
            categoryHeader.className = 'exam-category';
            categoryHeader.textContent = category;
            examListContainer.appendChild(categoryHeader);
            
            const examGrid = document.createElement('div');
            examGrid.className = 'exam-grid';
            
            categoryExams.forEach(exam => {
                const examItem = document.createElement('div');
                examItem.className = 'exam-item';
                examItem.dataset.examId = exam.id;
                
                const examTitle = document.createElement('div');
                examTitle.className = 'exam-title';
                examTitle.textContent = exam.name;
                examItem.appendChild(examTitle);
                
                // 進捗情報があれば表示
                const progress = storageManager.loadProgress(exam.id);
                if (progress) {
                    const progressBar = document.createElement('div');
                    progressBar.className = 'progress-bar';
                    
                    const progressPercentage = Math.round((progress.totalAnswered / progress.totalQuestions) * 100);
                    
                    const progressFill = document.createElement('div');
                    progressFill.className = 'progress-fill';
                    progressFill.style.width = `${progressPercentage}%`;
                    
                    progressBar.appendChild(progressFill);
                    examItem.appendChild(progressBar);
                    
                    const progressInfo = document.createElement('div');
                    progressInfo.className = 'progress-info';
                    progressInfo.innerHTML = `
                        <span class="progress-text">進捗: ${progress.totalAnswered}/${progress.totalQuestions} 問</span>
                        <span class="accuracy-text">正答率: ${calculateAccuracyRate(progress.correctCount, progress.totalAnswered)}%</span>
                    `;
                    examItem.appendChild(progressInfo);
                    
                    // 完了済みの場合はバッジを表示
                    if (progress.totalAnswered === progress.totalQuestions) {
                        const completeBadge = document.createElement('div');
                        completeBadge.className = 'complete-badge';
                        completeBadge.textContent = '完了';
                        examItem.appendChild(completeBadge);
                    }
                }
                
                // 開始ボタン
                const startButton = document.createElement('button');
                startButton.className = 'btn btn-primary start-exam-btn';
                startButton.textContent = progress ? '続ける' : '開始';
                startButton.addEventListener('click', (e) => {
                    e.stopPropagation(); // 親要素のクリックイベントを発火させない
                    startQuiz(exam.id);
                });
                examItem.appendChild(startButton);
                
                examItem.addEventListener('click', () => selectExam(exam.id));
                examGrid.appendChild(examItem);
            });
            
            examListContainer.appendChild(examGrid);
        });
        
        // ランダム出題の説明を追加
        const randomInfo = document.createElement('div');
        randomInfo.className = 'random-info';
        randomInfo.innerHTML = `
            <p>「ランダム出題で開始」ボタンをクリックすると、全ての試験から問題がランダムに出題されます。</p>
        `;
        examListContainer.appendChild(randomInfo);
    }
    
    /**
     * 試験を選択
     * @param {string} examId 試験ID
     */
    async function selectExam(examId) {
        try {
            // 選択状態を更新
            document.querySelectorAll('.exam-item').forEach(item => {
                item.classList.remove('selected');
                if (item.dataset.examId === examId) {
                    item.classList.add('selected');
                }
            });
            
            selectedExamId = examId;
            
            // 選択した試験の情報を表示
            const selectedExam = dataLoader.availableExams.find(exam => exam.id === examId);
            if (selectedExam) {
                const progress = storageManager.loadProgress(examId);
                
                // 選択した試験の詳細情報を表示
                const examDetailContainer = document.getElementById('exam-detail');
                if (!examDetailContainer) {
                    const detailContainer = document.createElement('div');
                    detailContainer.id = 'exam-detail';
                    detailContainer.className = 'exam-detail';
                    
                    const detailTitle = document.createElement('h3');
                    detailTitle.textContent = selectedExam.name;
                    
                    const detailInfo = document.createElement('div');
                    detailInfo.className = 'detail-info';
                    
                    if (progress) {
                        detailInfo.innerHTML = `
                            <p>進捗: ${progress.totalAnswered}/${progress.totalQuestions} 問</p>
                            <p>正答率: ${calculateAccuracyRate(progress.correctCount, progress.totalAnswered)}%</p>
                            <p>最終更新: ${new Date(progress.lastUpdated).toLocaleString()}</p>
                        `;
                    } else {
                        detailInfo.innerHTML = `<p>まだ回答していません</p>`;
                    }
                    
                    const startButton = document.createElement('button');
                    startButton.className = 'btn btn-primary';
                    startButton.textContent = progress ? '続ける' : '開始';
                    startButton.addEventListener('click', () => startQuiz(examId));
                    
                    const resetButton = document.createElement('button');
                    resetButton.className = 'btn btn-secondary';
                    resetButton.textContent = 'リセット';
                    resetButton.disabled = !progress;
                    resetButton.addEventListener('click', () => {
                        if (confirm('この試験の進捗をリセットしますか？')) {
                            storageManager.clearProgress(examId);
                            selectExam(examId); // 表示を更新
                            displayExamSelection(dataLoader.availableExams); // 一覧も更新
                        }
                    });
                    
                    detailContainer.appendChild(detailTitle);
                    detailContainer.appendChild(detailInfo);
                    detailContainer.appendChild(startButton);
                    detailContainer.appendChild(resetButton);
                    
                    // 既存の詳細情報があれば置き換え、なければ追加
                    const existingDetail = document.getElementById('exam-detail');
                    if (existingDetail) {
                        existingDetail.replaceWith(detailContainer);
                    } else {
                        examSelectionSection.appendChild(detailContainer);
                    }
                }
            }
        } catch (error) {
            console.error('試験の選択に失敗しました:', error);
            alert('試験データの読み込みに失敗しました。別の試験を選択してください。');
        }
    }
    
    /**
     * クイズを開始
     * @param {string} examId 試験ID（nullの場合はランダム出題）
     * @param {boolean} resetProgress 進捗をリセットするかどうか
     */
    async function startQuiz(examId, resetProgress = false) {
        try {
            // ローディング表示
            showLoading('問題データを読み込んでいます...');
            
            let questions = [];
            let examName = 'ランダム出題';
            
            if (examId) {
                // 特定の試験データを読み込む
                const examData = await dataLoader.loadExamData(examId);
                questions = examData.questions;
                examName = examData.name;
            } else {
                // 全ての試験データを読み込んでランダムに出題
                const availableExams = await dataLoader.getAvailableExams();
                const allQuestions = [];
                
                for (const exam of availableExams) {
                    try {
                        const examData = await dataLoader.loadExamData(exam.id);
                        allQuestions.push(...examData.questions.map(q => ({
                            ...q,
                            examId: exam.id
                        })));
                    } catch (error) {
                        console.error(`試験 ${exam.id} の読み込みに失敗しました:`, error);
                    }
                }
                
                // 問題をシャッフル
                for (let i = allQuestions.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
                }
                
                questions = allQuestions;
                examId = 'random';
            }
            
            if (questions.length === 0) {
                hideLoading();
                throw new Error('問題データが見つかりませんでした。');
            }
            
            // クイズインスタンスを作成
            currentQuiz = new Quiz(questions, examId);
            
            // 進捗情報があれば復元（リセットが指定されていない場合）
            if (!resetProgress) {
                const savedProgress = storageManager.loadProgress(examId);
                if (savedProgress) {
                    currentQuiz.restoreProgress(savedProgress);
                }
            } else {
                // 進捗をリセットする場合は、ストレージからも削除
                storageManager.clearProgress(examId);
            }
            
            // 画面を切り替え
            examSelectionSection.classList.add('hidden');
            quizContainer.classList.remove('hidden');
            finalResultsSection.classList.add('hidden');
            
            // 試験情報を表示
            examInfoElement.textContent = examName;
            
            // 最初の問題を表示
            await displayCurrentQuestion();
            updateProgressDisplay();
            
            // ローディング非表示
            hideLoading();
        } catch (error) {
            hideLoading();
            console.error('クイズの開始に失敗しました:', error);
            alert('クイズの開始に失敗しました。ページを再読み込みしてください。');
        }
    }
    
    /**
     * ローディング表示
     * @param {string} message ローディングメッセージ
     */
    function showLoading(message) {
        // 既存のローディング要素があれば削除
        hideLoading();
        
        // ローディング要素を作成
        const loadingElement = document.createElement('div');
        loadingElement.id = 'loading-overlay';
        loadingElement.className = 'loading-overlay';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        
        const messageElement = document.createElement('p');
        messageElement.className = 'loading-message';
        messageElement.textContent = message || 'Loading...';
        
        loadingElement.appendChild(spinner);
        loadingElement.appendChild(messageElement);
        
        document.body.appendChild(loadingElement);
    }
    
    /**
     * ローディング非表示
     */
    function hideLoading() {
        const loadingElement = document.getElementById('loading-overlay');
        if (loadingElement) {
            loadingElement.remove();
        }
    }
    
    /**
     * 現在の問題を表示
     */
    async function displayCurrentQuestion() {
        if (!currentQuiz) return;
        
        const question = currentQuiz.getCurrentQuestion();
        if (!question) return;
        
        // 問題番号を表示
        questionNumberElement.textContent = `問題 ${currentQuiz.currentIndex + 1}/${currentQuiz.questions.length}`;
        
        // 問題文を表示
        questionTextElement.textContent = question.question;
        
        // 画像を表示
        await displayQuestionImages(question);
        
        // 選択肢を表示
        displayOptions(question);
        
        // 出典情報を表示
        const examId = question.examId || currentQuiz.examId;
        const questionNumber = question.number;
        const citationText = dataLoader.generateCitation(examId, questionNumber);
        document.getElementById('question-citation').textContent = citationText;
        
        // 回答結果をクリア
        answerResultElement.classList.add('hidden');
        
        // 既に回答済みの場合は回答を表示
        const currentAnswer = currentQuiz.getCurrentAnswer();
        if (currentAnswer) {
            showAnswerResult(currentAnswer.selected);
        } else {
            // 回答していない場合は次へボタンを非表示
            nextButton.classList.add('hidden');
        }
        
        // ナビゲーションボタンの状態を更新
        updateNavigationButtons();
    }
    
    /**
     * 問題の画像を表示
     * @param {Object} question 問題データ
     */
    async function displayQuestionImages(question) {
        questionImagesElement.innerHTML = '';
        
        // 問題に画像がある場合
        if (question.hasImages) {
            try {
                // 画像の読み込み状態を追跡
                let imageLoadSuccess = false;
                
                // 問題本体の画像
                if (question.imagePaths && question.imagePaths.question) {
                    // 既に解決されたパスがある場合
                    await displaySingleImage(
                        question.imagePaths.question, 
                        `問題${question.number}の図`, 
                        'question-image'
                    ).then(success => {
                        imageLoadSuccess = imageLoadSuccess || success;
                    });
                } else {
                    // パスを解決して表示
                    const examId = question.examId || currentQuiz.examId;
                    const imagePath = dataLoader.resolveImagePath(examId, question.number);
                    
                    const imageExists = await dataLoader.checkImageExists(imagePath);
                    if (imageExists) {
                        await displaySingleImage(
                            imagePath, 
                            `問題${question.number}の図`, 
                            'question-image'
                        ).then(success => {
                            imageLoadSuccess = imageLoadSuccess || success;
                        });
                    }
                }
                
                // 選択肢の画像（存在する場合）
                if (question.imagePaths) {
                    // 選択肢の画像を表示するコンテナ
                    const optionImagesContainer = document.createElement('div');
                    optionImagesContainer.className = 'option-images';
                    
                    // 選択肢の画像を並行して読み込む
                    const optionEntries = Object.entries(question.imagePaths).filter(([key]) => key !== 'question');
                    
                    if (optionEntries.length > 0) {
                        const optionResults = await Promise.all(optionEntries.map(async ([option, path]) => {
                            const optionContainer = document.createElement('div');
                            optionContainer.className = 'option-image-container';
                            
                            const optionLabel = document.createElement('div');
                            optionLabel.className = 'option-label';
                            optionLabel.textContent = option;
                            optionContainer.appendChild(optionLabel);
                            
                            // 画像を読み込む
                            const success = await new Promise(resolve => {
                                const img = new Image();
                                img.src = path;
                                img.alt = `選択肢${option}の図`;
                                img.className = 'option-image';
                                img.loading = 'lazy';
                                
                                img.onload = () => {
                                    optionContainer.appendChild(img);
                                    resolve(true);
                                };
                                
                                img.onerror = () => {
                                    const errorText = document.createElement('p');
                                    errorText.className = 'image-error-text';
                                    errorText.textContent = `[選択肢${option}の図]`;
                                    optionContainer.appendChild(errorText);
                                    resolve(false);
                                };
                                
                                // タイムアウト処理（5秒）
                                setTimeout(() => {
                                    if (!img.complete) {
                                        img.src = ''; // 読み込みを中止
                                        const errorText = document.createElement('p');
                                        errorText.className = 'image-error-text';
                                        errorText.textContent = `[選択肢${option}の図の読み込みがタイムアウトしました]`;
                                        optionContainer.appendChild(errorText);
                                        resolve(false);
                                    }
                                }, 5000);
                            });
                            
                            return { container: optionContainer, success };
                        }));
                        
                        // 成功した画像があれば追加
                        optionResults.forEach(({ container, success }) => {
                            optionImagesContainer.appendChild(container);
                            imageLoadSuccess = imageLoadSuccess || success;
                        });
                        
                        if (optionImagesContainer.children.length > 0) {
                            questionImagesElement.appendChild(optionImagesContainer);
                        }
                    }
                }
                
                // 画像が表示されない場合は、コンテナを非表示にする
                if (questionImagesElement.children.length === 0 || !imageLoadSuccess) {
                    questionImagesElement.style.display = 'none';
                } else {
                    questionImagesElement.style.display = 'block';
                }
                
            } catch (error) {
                console.error('画像の表示に失敗しました:', error);
                questionImagesElement.innerHTML = '<p class="image-error-text">[図表の表示に失敗しました]</p>';
                questionImagesElement.style.display = 'block';
            }
        } else {
            // 画像がない場合はコンテナを非表示
            questionImagesElement.style.display = 'none';
        }
    }
    
    /**
     * 単一の画像を表示
     * @param {string} src 画像のパス
     * @param {string} alt 代替テキスト
     * @param {string} className CSSクラス名
     * @returns {Promise<boolean>} 画像の読み込みが成功したかどうか
     */
    async function displaySingleImage(src, alt, className) {
        return new Promise(resolve => {
            const img = new Image();
            img.src = src;
            img.alt = alt;
            img.className = className;
            img.loading = 'lazy';
            
            img.onload = () => {
                questionImagesElement.appendChild(img);
                resolve(true);
            };
            
            img.onerror = () => {
                const errorText = document.createElement('p');
                errorText.className = 'image-error-text';
                errorText.textContent = `[${alt}]`;
                questionImagesElement.appendChild(errorText);
                resolve(false);
            };
            
            // タイムアウト処理（5秒）
            setTimeout(() => {
                if (!img.complete) {
                    img.src = ''; // 読み込みを中止
                    const errorText = document.createElement('p');
                    errorText.className = 'image-error-text';
                    errorText.textContent = `[${alt}の読み込みがタイムアウトしました]`;
                    questionImagesElement.appendChild(errorText);
                    resolve(false);
                }
            }, 5000);
        });
    }
    
    /**
     * 選択肢を表示
     * @param {Object} question 問題データ
     */
    function displayOptions(question) {
        optionsContainer.innerHTML = '';
        
        Object.entries(question.options).forEach(([key, value]) => {
            const option = document.createElement('div');
            option.className = 'option';
            option.dataset.option = key;
            option.innerHTML = `<strong>${key}</strong>: ${value}`;
            
            // 既に回答済みの場合はスタイルを適用
            const currentAnswer = currentQuiz.getCurrentAnswer();
            if (currentAnswer) {
                if (key === currentAnswer.selected) {
                    option.classList.add('selected');
                    option.classList.add(currentAnswer.correct ? 'correct' : 'incorrect');
                }
                if (key === question.answer && !currentAnswer.correct) {
                    option.classList.add('correct');
                }
            } else {
                // 未回答の場合はクリックイベントを追加
                option.addEventListener('click', () => selectOption(key));
            }
            
            optionsContainer.appendChild(option);
        });
    }
    
    /**
     * 選択肢を選択
     * @param {string} option 選択された選択肢
     */
    function selectOption(option) {
        // 既に回答済みの場合は何もしない
        if (currentQuiz.isCurrentQuestionAnswered()) return;
        
        // 選択状態を視覚的に表示（アニメーション効果を追加）
        document.querySelectorAll('.option').forEach(el => {
            el.classList.remove('selected', 'selecting');
            if (el.dataset.option === option) {
                el.classList.add('selecting');
                
                // アニメーション効果後に回答処理
                setTimeout(() => {
                    el.classList.remove('selecting');
                    el.classList.add('selected');
                    
                    // 回答を処理
                    showAnswerResult(option);
                    
                    // 進捗を保存
                    saveProgress();
                }, 300);
            }
        });
    }
    
    /**
     * 回答結果を表示
     * @param {string} selectedOption 選択された選択肢
     */
    function showAnswerResult(selectedOption) {
        const result = currentQuiz.submitAnswer(selectedOption);
        const currentQuestion = currentQuiz.getCurrentQuestion();
        
        // 回答結果を表示（アニメーション効果を追加）
        answerResultElement.classList.remove('hidden', 'correct', 'incorrect', 'fade-in');
        void answerResultElement.offsetWidth; // リフロー強制でアニメーションをリセット
        answerResultElement.classList.add(result.isCorrect ? 'correct' : 'incorrect', 'fade-in');
        
        // 結果メッセージを設定
        if (result.isCorrect) {
            resultMessageElement.innerHTML = '<span class="result-icon">✓</span> 正解です！';
        } else {
            resultMessageElement.innerHTML = '<span class="result-icon">✗</span> 不正解です。';
        }
        
        // 正解の選択肢を表示
        correctAnswerElement.innerHTML = `正解: <strong>${result.correctAnswer}</strong> ${currentQuestion.options[result.correctAnswer]}`;
        
        // 解説があれば表示
        if (currentQuestion.explanation) {
            // 既存の解説を削除
            const existingExplanation = document.getElementById('explanation-container');
            if (existingExplanation) {
                existingExplanation.remove();
            }
            
            // 解説コンテナを作成
            const explanationContainer = document.createElement('div');
            explanationContainer.id = 'explanation-container';
            explanationContainer.className = 'explanation-container fade-in';
            
            // 解説ヘッダー
            const explanationHeader = document.createElement('h4');
            explanationHeader.className = 'explanation-header';
            explanationHeader.textContent = '解説';
            explanationContainer.appendChild(explanationHeader);
            
            // 解説テキスト
            const explanationText = document.createElement('p');
            explanationText.className = 'explanation-text';
            explanationText.textContent = currentQuestion.explanation;
            explanationContainer.appendChild(explanationText);
            
            // 解説を回答結果の後に追加
            answerResultElement.appendChild(explanationContainer);
        }
        
        // 解説があれば表示
        if (result.explanation) {
            // 既存の解説を削除
            const existingExplanation = document.getElementById('explanation-container');
            if (existingExplanation) {
                existingExplanation.remove();
            }
            
            // 解説コンテナを作成
            const explanationContainer = document.createElement('div');
            explanationContainer.id = 'explanation-container';
            explanationContainer.className = 'explanation-container fade-in';
            
            // 解説ヘッダー
            const explanationHeader = document.createElement('h4');
            explanationHeader.className = 'explanation-header';
            explanationHeader.textContent = '解説';
            explanationContainer.appendChild(explanationHeader);
            
            // 解説テキスト
            const explanationText = document.createElement('p');
            explanationText.className = 'explanation-text';
            explanationText.textContent = result.explanation;
            explanationContainer.appendChild(explanationText);
            
            // 解説を回答結果の後に追加
            answerResultElement.appendChild(explanationContainer);
        }
        
        // 選択肢のスタイルを更新（アニメーション効果を追加）
        document.querySelectorAll('.option').forEach(el => {
            const optionKey = el.dataset.option;
            el.classList.remove('correct', 'incorrect');
            
            if (optionKey === selectedOption) {
                el.classList.add('selected');
                el.classList.add(result.isCorrect ? 'correct' : 'incorrect');
                
                // 選択した選択肢にアイコンを追加
                const icon = document.createElement('span');
                icon.className = 'result-icon option-icon';
                icon.textContent = result.isCorrect ? '✓' : '✗';
                
                // 既存のアイコンを削除
                const existingIcon = el.querySelector('.option-icon');
                if (existingIcon) {
                    existingIcon.remove();
                }
                
                el.appendChild(icon);
            }
            
            // 不正解の場合は正解の選択肢もハイライト
            if (optionKey === result.correctAnswer && !result.isCorrect) {
                el.classList.add('correct');
                
                // 正解の選択肢にアイコンを追加
                const icon = document.createElement('span');
                icon.className = 'result-icon option-icon correct-icon';
                icon.textContent = '✓';
                
                // 既存のアイコンを削除
                const existingIcon = el.querySelector('.option-icon');
                if (existingIcon) {
                    existingIcon.remove();
                }
                
                el.appendChild(icon);
            }
        });
        
        // 次へボタンを表示（アニメーション効果を追加）
        nextButton.classList.remove('hidden');
        nextButton.classList.add('button-appear');
        
        // 進捗表示を更新
        updateProgressDisplay();
    }
    
    /**
     * 進捗表示を更新
     */
    function updateProgressDisplay() {
        if (!currentQuiz) return;
        
        const progress = currentQuiz.getProgress();
        
        // 基本的な進捗情報を更新
        correctCountElement.textContent = `正解: ${progress.correctCount}`;
        incorrectCountElement.textContent = `不正解: ${progress.incorrectCount}`;
        
        const accuracyRate = calculateAccuracyRate(progress.correctCount, progress.totalAnswered);
        accuracyRateElement.textContent = `正答率: ${accuracyRate}%`;
        
        // 進捗バーを更新
        updateProgressBar(progress);
        
        // 残り問題数を表示
        const remainingQuestions = progress.totalQuestions - progress.totalAnswered;
        const remainingElement = document.getElementById('remaining-questions');
        
        if (remainingElement) {
            remainingElement.textContent = `残り: ${remainingQuestions}問`;
        } else {
            const quizProgress = document.querySelector('.quiz-progress');
            if (quizProgress) {
                const remainingSpan = document.createElement('span');
                remainingSpan.id = 'remaining-questions';
                remainingSpan.textContent = `残り: ${remainingQuestions}問`;
                quizProgress.appendChild(remainingSpan);
            }
        }
    }
    
    /**
     * 進捗バーを更新
     * @param {Object} progress 進捗情報
     */
    function updateProgressBar(progress) {
        // 進捗バーの要素を取得または作成
        let progressBarContainer = document.querySelector('.quiz-progress-bar');
        
        if (!progressBarContainer) {
            // 進捗バーのコンテナを作成
            progressBarContainer = document.createElement('div');
            progressBarContainer.className = 'quiz-progress-bar';
            
            // 進捗バーを作成
            const progressBar = document.createElement('div');
            progressBar.className = 'progress-bar-fill';
            progressBarContainer.appendChild(progressBar);
            
            // 進捗テキストを作成
            const progressText = document.createElement('div');
            progressText.className = 'progress-bar-text';
            progressBarContainer.appendChild(progressText);
            
            // 進捗バーを挿入
            const quizHeader = document.querySelector('.quiz-header');
            if (quizHeader) {
                quizHeader.after(progressBarContainer);
            }
        }
        
        // 進捗バーの幅を更新
        const progressPercentage = (progress.currentQuestion + 1) / progress.totalQuestions * 100;
        const progressBarFill = progressBarContainer.querySelector('.progress-bar-fill');
        if (progressBarFill) {
            progressBarFill.style.width = `${progressPercentage}%`;
        }
        
        // 進捗テキストを更新
        const progressText = progressBarContainer.querySelector('.progress-bar-text');
        if (progressText) {
            progressText.textContent = `${progress.currentQuestion + 1} / ${progress.totalQuestions}`;
        }
    }
    
    /**
     * 正答率を計算
     * @param {number} correct 正解数
     * @param {number} total 総回答数
     * @returns {string} 正答率（%）
     */
    function calculateAccuracyRate(correct, total) {
        if (total === 0) return '0';
        return ((correct / total) * 100).toFixed(1);
    }
    
    /**
     * ナビゲーションボタンの状態を更新
     */
    function updateNavigationButtons() {
        if (!currentQuiz) return;
        
        // 前へボタン
        prevButton.disabled = currentQuiz.currentIndex === 0;
        
        // 最後の問題かどうか
        const isLastQuestion = currentQuiz.currentIndex === currentQuiz.questions.length - 1;
        
        // 次へボタン（回答済みの場合のみ表示）
        if (currentQuiz.isCurrentQuestionAnswered()) {
            nextButton.classList.remove('hidden');
            
            if (isLastQuestion) {
                nextButton.textContent = '結果を表示';
                nextButton.classList.add('btn-secondary');
            } else {
                nextButton.textContent = '次の問題';
                nextButton.classList.remove('btn-secondary');
            }
        } else {
            nextButton.classList.add('hidden');
        }
        
        // 最初からボタン
        restartButton.classList.add('hidden');
        
        // 問題ジャンプボタンを更新
        updateQuestionJumpButtons();
    }
    
    /**
     * 問題ジャンプボタンを更新
     */
    function updateQuestionJumpButtons() {
        if (!currentQuiz) return;
        
        // 問題ジャンプボタンのコンテナを取得または作成
        let jumpButtonsContainer = document.querySelector('.question-jump-buttons');
        
        if (!jumpButtonsContainer) {
            // コンテナを作成
            jumpButtonsContainer = document.createElement('div');
            jumpButtonsContainer.className = 'question-jump-buttons';
            
            // ナビゲーションボタンの後に挿入
            const navigationButtons = document.querySelector('.navigation-buttons');
            if (navigationButtons) {
                navigationButtons.after(jumpButtonsContainer);
            }
        }
        
        // コンテナをクリア
        jumpButtonsContainer.innerHTML = '';
        
        // 問題数が多い場合は省略表示
        const totalQuestions = currentQuiz.questions.length;
        const currentIndex = currentQuiz.currentIndex;
        
        // 表示する問題番号の範囲を決定
        let startIndex = Math.max(0, currentIndex - 5);
        let endIndex = Math.min(totalQuestions - 1, currentIndex + 5);
        
        // 最低10個のボタンを表示するように調整
        if (endIndex - startIndex < 10) {
            if (startIndex === 0) {
                endIndex = Math.min(totalQuestions - 1, 10);
            } else if (endIndex === totalQuestions - 1) {
                startIndex = Math.max(0, totalQuestions - 11);
            }
        }
        
        // 「最初へ」ボタン
        if (startIndex > 0) {
            const firstButton = document.createElement('button');
            firstButton.className = 'jump-button first-button';
            firstButton.textContent = '1';
            firstButton.addEventListener('click', () => goToQuestion(0));
            jumpButtonsContainer.appendChild(firstButton);
            
            if (startIndex > 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'jump-ellipsis';
                ellipsis.textContent = '...';
                jumpButtonsContainer.appendChild(ellipsis);
            }
        }
        
        // 問題ボタンを生成
        for (let i = startIndex; i <= endIndex; i++) {
            const button = document.createElement('button');
            button.className = 'jump-button';
            button.textContent = i + 1;
            
            // 現在の問題はハイライト
            if (i === currentIndex) {
                button.classList.add('current');
            }
            
            // 回答済みの問題はマーク
            const answer = currentQuiz.answers.find(a => a.questionNumber === currentQuiz.questions[i].number);
            if (answer) {
                button.classList.add(answer.correct ? 'correct' : 'incorrect');
            }
            
            button.addEventListener('click', () => goToQuestion(i));
            jumpButtonsContainer.appendChild(button);
        }
        
        // 「最後へ」ボタン
        if (endIndex < totalQuestions - 1) {
            if (endIndex < totalQuestions - 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'jump-ellipsis';
                ellipsis.textContent = '...';
                jumpButtonsContainer.appendChild(ellipsis);
            }
            
            const lastButton = document.createElement('button');
            lastButton.className = 'jump-button last-button';
            lastButton.textContent = totalQuestions;
            lastButton.addEventListener('click', () => goToQuestion(totalQuestions - 1));
            jumpButtonsContainer.appendChild(lastButton);
        }
    }
    
    /**
     * 指定した問題に移動
     * @param {number} index 問題のインデックス
     */
    function goToQuestion(index) {
        if (!currentQuiz) return;
        
        if (currentQuiz.goToQuestion(index)) {
            displayCurrentQuestion();
        }
    }
    
    /**
     * 次の問題に進む
     */
    function goToNextQuestion() {
        if (!currentQuiz) return;
        
        // 最後の問題の場合は結果を表示
        if (currentQuiz.currentIndex === currentQuiz.questions.length - 1) {
            showFinalResults();
            return;
        }
        
        // 次の問題に進む
        currentQuiz.nextQuestion();
        displayCurrentQuestion();
        
        // スクロールを上部に戻す
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * 前の問題に戻る
     */
    function goToPreviousQuestion() {
        if (!currentQuiz || !currentQuiz.previousQuestion()) return;
        
        displayCurrentQuestion();
        
        // スクロールを上部に戻す
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * 最終結果を表示
     */
    function showFinalResults() {
        if (!currentQuiz) return;
        
        const progress = currentQuiz.getProgress();
        
        // 結果を表示
        finalCorrectCountElement.textContent = progress.correctCount;
        finalIncorrectCountElement.textContent = progress.incorrectCount;
        finalTotalCountElement.textContent = progress.totalQuestions;
        
        const accuracyRate = calculateAccuracyRate(progress.correctCount, progress.totalAnswered);
        finalAccuracyRateElement.textContent = `${accuracyRate}%`;
        
        // 合格判定（正答率70%以上を合格とする）
        const resultGrade = document.createElement('div');
        resultGrade.className = 'result-grade';
        
        if (accuracyRate >= 70) {
            resultGrade.innerHTML = '<span class="grade pass">合格</span>';
            resultGrade.innerHTML += '<p>おめでとうございます！合格ラインをクリアしました。</p>';
        } else {
            resultGrade.innerHTML = '<span class="grade fail">不合格</span>';
            resultGrade.innerHTML += '<p>もう少し頑張りましょう。再挑戦してみてください。</p>';
        }
        
        // 既存の結果グレードがあれば置き換え、なければ追加
        const existingGrade = document.querySelector('.result-grade');
        if (existingGrade) {
            existingGrade.replaceWith(resultGrade);
        } else {
            const resultsSummary = document.querySelector('.results-summary');
            if (resultsSummary) {
                resultsSummary.after(resultGrade);
            }
        }
        
        // 間違えた問題のリストを表示
        const incorrectAnswers = progress.answers.filter(a => !a.correct);
        
        if (incorrectAnswers.length > 0) {
            const incorrectList = document.createElement('div');
            incorrectList.className = 'incorrect-list';
            incorrectList.innerHTML = '<h3>間違えた問題</h3>';
            
            const list = document.createElement('ul');
            incorrectAnswers.forEach(answer => {
                const question = currentQuiz.questions.find(q => q.number === answer.questionNumber);
                if (question) {
                    const listItem = document.createElement('li');
                    listItem.innerHTML = `
                        <span class="question-number">問${question.number}</span>
                        <span class="question-text">${question.question.substring(0, 50)}${question.question.length > 50 ? '...' : ''}</span>
                        <span class="answer-info">
                            あなたの回答: <span class="user-answer">${answer.selected}</span>
                            正解: <span class="correct-answer">${question.answer}</span>
                        </span>
                    `;
                    list.appendChild(listItem);
                }
            });
            
            incorrectList.appendChild(list);
            
            // 既存のリストがあれば置き換え、なければ追加
            const existingList = document.querySelector('.incorrect-list');
            if (existingList) {
                existingList.replaceWith(incorrectList);
            } else {
                const resultButtons = document.querySelector('#final-results .btn');
                if (resultButtons) {
                    resultButtons.before(incorrectList);
                } else {
                    finalResultsSection.appendChild(incorrectList);
                }
            }
        }
        
        // 画面を切り替え
        quizContainer.classList.add('hidden');
        finalResultsSection.classList.remove('hidden');
        
        // スクロールを上部に戻す
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    /**
     * クイズをリスタート
     */
    function restartQuiz() {
        if (currentQuiz) {
            const examId = currentQuiz.examId;
            
            // 進捗をクリア
            storageManager.clearProgress(examId);
            
            // 同じ試験でクイズを再開始
            if (examId === 'random') {
                startQuiz(null);
            } else {
                startQuiz(examId);
            }
        } else {
            // 試験選択画面に戻る
            showExamSelection();
        }
    }
    
    /**
     * 試験選択画面に戻る
     */
    function showExamSelection() {
        currentQuiz = null;
        selectedExamId = null;
        
        examSelectionSection.classList.remove('hidden');
        quizContainer.classList.add('hidden');
        finalResultsSection.classList.add('hidden');
    }
    
    /**
     * 進捗を保存
     * @param {boolean} showNotification 保存通知を表示するかどうか
     */
    function saveProgress(showNotification = false) {
        if (!currentQuiz) return;
        
        try {
            const progress = currentQuiz.getProgress();
            const saved = storageManager.saveProgress(currentQuiz.examId, progress);
            
            if (showNotification && saved) {
                showToast('進捗を保存しました');
            }
            
            return saved;
        } catch (error) {
            console.error('進捗の保存に失敗しました:', error);
            
            if (showNotification) {
                showToast('進捗の保存に失敗しました', 'error');
            }
            
            return false;
        }
    }
    
    /**
     * トースト通知を表示
     * @param {string} message メッセージ
     * @param {string} type 通知タイプ ('success', 'error', 'info')
     * @param {number} duration 表示時間（ミリ秒）
     */
    function showToast(message, type = 'success', duration = 3000) {
        // 既存のトーストを削除
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }
        
        // トースト要素を作成
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        // トーストを表示
        document.body.appendChild(toast);
        
        // アニメーション用にタイムアウトを設定
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // 指定時間後に削除
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, duration);
    }
    
    /**
     * イベントリスナーを設定
     */
    function setupEventListeners() {
        // ランダム出題開始ボタン
        startRandomButton.addEventListener('click', () => startQuiz(null));
        
        // 選択した試験で開始ボタン
        document.addEventListener('click', (e) => {
            if (e.target.matches('.exam-item') || e.target.closest('.exam-item')) {
                const examItem = e.target.matches('.exam-item') ? e.target : e.target.closest('.exam-item');
                const examId = examItem.dataset.examId;
                selectExam(examId);
                startQuiz(examId);
            }
        });
        
        // 前へボタン
        prevButton.addEventListener('click', goToPreviousQuestion);
        
        // 次へボタン
        nextButton.addEventListener('click', goToNextQuestion);
        
        // 最初からボタン
        restartButton.addEventListener('click', restartQuiz);
        
        // 結果画面の最初からボタン
        restartQuizButton.addEventListener('click', () => {
            showExamSelection();
        });
        
        // ページ離脱時に進捗を保存
        window.addEventListener('beforeunload', saveProgress);
        
        // 定期的に進捗を保存（30秒ごと）
        setInterval(() => {
            if (currentQuiz) {
                saveProgress();
            }
        }, 30000);
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            // フォーム要素にフォーカスがある場合は無視
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
                return;
            }
            
            // クイズ中のみ有効
            if (!currentQuiz || quizContainer.classList.contains('hidden')) {
                return;
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                    // 左矢印キー：前の問題
                    goToPreviousQuestion();
                    break;
                case 'ArrowRight':
                    // 右矢印キー：次の問題（回答済みの場合のみ）
                    if (currentQuiz.isCurrentQuestionAnswered()) {
                        goToNextQuestion();
                    }
                    break;
                case '1':
                case 'a':
                case 'ア':
                    // 1キー：選択肢ア
                    selectOption('ア');
                    break;
                case '2':
                case 'i':
                case 'イ':
                    // 2キー：選択肢イ
                    selectOption('イ');
                    break;
                case '3':
                case 'u':
                case 'ウ':
                    // 3キー：選択肢ウ
                    selectOption('ウ');
                    break;
                case '4':
                case 'e':
                case 'エ':
                    // 4キー：選択肢エ
                    selectOption('エ');
                    break;
                case 's':
                    // Sキー：進捗を手動保存
                    saveProgress(true);
                    break;
            }
        });
    }
    
    /**
     * 最後のセッションを復元
     */
    function restoreLastSession() {
        try {
            // 全ての進捗データを取得
            const allProgress = storageManager.getAllProgress();
            
            // 進捗データがない場合は何もしない
            if (Object.keys(allProgress).length === 0) {
                return;
            }
            
            // 最後に更新された進捗を探す
            let lastExamId = null;
            let lastUpdated = 0;
            
            Object.entries(allProgress).forEach(([examId, progress]) => {
                const updated = new Date(progress.lastUpdated || 0).getTime();
                if (updated > lastUpdated) {
                    lastUpdated = updated;
                    lastExamId = examId;
                }
            });
            
            // 最後のセッションがある場合は復元するか確認
            if (lastExamId && lastUpdated > 0) {
                const progress = allProgress[lastExamId];
                const examInfo = dataLoader.availableExams.find(exam => exam.id === lastExamId) || { name: lastExamId };
                
                // 最終更新から24時間以内の場合のみ表示
                const now = new Date().getTime();
                const hoursSinceLastUpdate = (now - lastUpdated) / (1000 * 60 * 60);
                
                if (hoursSinceLastUpdate < 24) {
                    // 復元確認ダイアログを表示
                    const sessionInfo = document.createElement('div');
                    sessionInfo.className = 'session-info';
                    sessionInfo.innerHTML = `
                        <h3>前回のセッションを復元しますか？</h3>
                        <p><strong>${examInfo.name}</strong></p>
                        <p>進捗: ${progress.totalAnswered}/${progress.totalQuestions} 問</p>
                        <p>正答率: ${calculateAccuracyRate(progress.correctCount, progress.totalAnswered)}%</p>
                        <p>最終更新: ${new Date(progress.lastUpdated).toLocaleString()}</p>
                        <div class="session-buttons">
                            <button id="restore-session" class="btn btn-primary">復元する</button>
                            <button id="ignore-session" class="btn">無視する</button>
                        </div>
                    `;
                    
                    // ダイアログを表示
                    document.body.appendChild(sessionInfo);
                    
                    // イベントリスナーを設定
                    document.getElementById('restore-session').addEventListener('click', () => {
                        sessionInfo.remove();
                        startQuiz(lastExamId);
                    });
                    
                    document.getElementById('ignore-session').addEventListener('click', () => {
                        sessionInfo.remove();
                    });
                }
            }
        } catch (error) {
            console.error('セッションの復元に失敗しました:', error);
        }
    }
    
    // アプリケーションを初期化
    initApp();
});