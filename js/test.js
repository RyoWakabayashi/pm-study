/**
 * テストスクリプト
 * 各機能の単体テストと統合テストを実行
 */
document.addEventListener('DOMContentLoaded', () => {
    // テスト結果を表示する要素
    const testResultsContainer = document.createElement('div');
    testResultsContainer.id = 'test-results';
    testResultsContainer.className = 'test-results';
    document.body.appendChild(testResultsContainer);
    
    // テスト結果を表示
    function logTestResult(testName, passed, message = '') {
        const resultItem = document.createElement('div');
        resultItem.className = `test-result ${passed ? 'passed' : 'failed'}`;
        resultItem.innerHTML = `
            <span class="test-status">${passed ? '✓' : '✗'}</span>
            <span class="test-name">${testName}</span>
            ${message ? `<span class="test-message">${message}</span>` : ''}
        `;
        testResultsContainer.appendChild(resultItem);
        
        console.log(`${passed ? 'PASS' : 'FAIL'}: ${testName}${message ? ' - ' + message : ''}`);
    }
    
    // テストを実行
    async function runTests() {
        testResultsContainer.innerHTML = '<h2>テスト実行中...</h2>';
        
        let passedCount = 0;
        let failedCount = 0;
        
        try {
            // DataLoader テスト
            await testDataLoader();
            
            // Quiz テスト
            testQuiz();
            
            // StorageManager テスト
            testStorageManager();
            
            // UI テスト
            await testUI();
            
            // 統合テスト
            await testIntegration();
            
            // テスト結果のサマリーを表示
            const totalTests = passedCount + failedCount;
            testResultsContainer.innerHTML = `
                <h2>テスト結果</h2>
                <div class="test-summary">
                    <p>合計テスト数: ${totalTests}</p>
                    <p class="passed">成功: ${passedCount}</p>
                    <p class="failed">失敗: ${failedCount}</p>
                </div>
                <div id="test-details"></div>
                <button id="close-tests" class="btn btn-primary">閉じる</button>
            `;
            
            // 閉じるボタンのイベントリスナー
            document.getElementById('close-tests').addEventListener('click', () => {
                testResultsContainer.remove();
            });
        } catch (error) {
            console.error('テストの実行中にエラーが発生しました:', error);
            testResultsContainer.innerHTML = `
                <h2>テストエラー</h2>
                <p class="error-message">${error.message}</p>
                <button id="close-tests" class="btn btn-primary">閉じる</button>
            `;
            
            document.getElementById('close-tests').addEventListener('click', () => {
                testResultsContainer.remove();
            });
        }
        
        // DataLoader テスト
        async function testDataLoader() {
            const dataLoader = new DataLoader();
            
            // getAvailableExams テスト
            try {
                const exams = await dataLoader.getAvailableExams();
                const passed = Array.isArray(exams) && exams.length > 0;
                logTestResult('DataLoader.getAvailableExams', passed);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('DataLoader.getAvailableExams', false, error.message);
                failedCount++;
            }
            
            // resolveImagePath テスト
            try {
                const imagePath = dataLoader.resolveImagePath('2022r04a_koudo_am1', '1');
                const expected = 'exam_data/images/2022r04a_koudo_am1/q01.png';
                const passed = imagePath === expected;
                logTestResult('DataLoader.resolveImagePath', passed, passed ? '' : `Expected: ${expected}, Got: ${imagePath}`);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('DataLoader.resolveImagePath', false, error.message);
                failedCount++;
            }
            
            // checkImageExists テスト
            try {
                const exists = await dataLoader.checkImageExists('css/style.css'); // 存在するファイル
                logTestResult('DataLoader.checkImageExists (existing file)', exists);
                if (exists) passedCount++; else failedCount++;
                
                const notExists = await dataLoader.checkImageExists('not-exists.png'); // 存在しないファイル
                logTestResult('DataLoader.checkImageExists (non-existing file)', !notExists);
                if (!notExists) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('DataLoader.checkImageExists', false, error.message);
                failedCount++;
            }
            
            // loadExamData テスト
            try {
                const examData = await dataLoader.loadExamData('2022r04a_koudo_am1');
                const passed = examData && examData.questions && Array.isArray(examData.questions);
                logTestResult('DataLoader.loadExamData', passed);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('DataLoader.loadExamData', false, error.message);
                failedCount++;
            }
        }
        
        // Quiz テスト
        function testQuiz() {
            // テスト用のダミーデータ
            const testQuestions = [
                {
                    number: '1',
                    question: 'テスト問題1',
                    options: { 'ア': '選択肢1', 'イ': '選択肢2', 'ウ': '選択肢3', 'エ': '選択肢4' },
                    answer: 'イ'
                },
                {
                    number: '2',
                    question: 'テスト問題2',
                    options: { 'ア': '選択肢1', 'イ': '選択肢2', 'ウ': '選択肢3', 'エ': '選択肢4' },
                    answer: 'ア'
                }
            ];
            
            const quiz = new Quiz(testQuestions, 'test');
            
            // getCurrentQuestion テスト
            try {
                const question = quiz.getCurrentQuestion();
                const passed = question && question.number === '1';
                logTestResult('Quiz.getCurrentQuestion', passed);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('Quiz.getCurrentQuestion', false, error.message);
                failedCount++;
            }
            
            // submitAnswer テスト
            try {
                const result = quiz.submitAnswer('イ'); // 正解
                const passed = result && result.isCorrect === true;
                logTestResult('Quiz.submitAnswer (correct)', passed);
                if (passed) passedCount++; else failedCount++;
                
                quiz.nextQuestion();
                const result2 = quiz.submitAnswer('ウ'); // 不正解
                const passed2 = result2 && result2.isCorrect === false;
                logTestResult('Quiz.submitAnswer (incorrect)', passed2);
                if (passed2) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('Quiz.submitAnswer', false, error.message);
                failedCount++;
            }
            
            // getProgress テスト
            try {
                const progress = quiz.getProgress();
                const passed = progress && progress.correctCount === 1 && progress.incorrectCount === 1;
                logTestResult('Quiz.getProgress', passed);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('Quiz.getProgress', false, error.message);
                failedCount++;
            }
        }
        
        // StorageManager テスト
        function testStorageManager() {
            const storageManager = new StorageManager();
            const testKey = 'test';
            const testData = { value: 'test', timestamp: Date.now() };
            
            // saveProgress テスト
            try {
                const saved = storageManager.saveProgress(testKey, testData);
                logTestResult('StorageManager.saveProgress', saved);
                if (saved) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('StorageManager.saveProgress', false, error.message);
                failedCount++;
            }
            
            // loadProgress テスト
            try {
                const loaded = storageManager.loadProgress(testKey);
                const passed = loaded && loaded.value === testData.value;
                logTestResult('StorageManager.loadProgress', passed);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('StorageManager.loadProgress', false, error.message);
                failedCount++;
            }
            
            // clearProgress テスト
            try {
                const cleared = storageManager.clearProgress(testKey);
                const loaded = storageManager.loadProgress(testKey);
                const passed = cleared && loaded === null;
                logTestResult('StorageManager.clearProgress', passed);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('StorageManager.clearProgress', false, error.message);
                failedCount++;
            }
        }
        
        // UI テスト
        async function testUI() {
            // DOM要素の存在チェック
            try {
                const elements = [
                    'exam-selection',
                    'quiz-container',
                    'final-results',
                    'exam-list',
                    'start-random',
                    'question-number',
                    'exam-info',
                    'question-text',
                    'question-images',
                    'options',
                    'answer-result',
                    'prev-button',
                    'next-button'
                ];
                
                let allExist = true;
                const missingElements = [];
                
                elements.forEach(id => {
                    const element = document.getElementById(id);
                    if (!element) {
                        allExist = false;
                        missingElements.push(id);
                    }
                });
                
                logTestResult('UI Elements Existence', allExist, allExist ? '' : `Missing elements: ${missingElements.join(', ')}`);
                if (allExist) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('UI Elements Existence', false, error.message);
                failedCount++;
            }
            
            // レスポンシブデザインテスト
            try {
                const viewportWidth = window.innerWidth;
                const isMobile = viewportWidth < 480;
                const isTablet = viewportWidth >= 480 && viewportWidth < 768;
                const isDesktop = viewportWidth >= 768;
                
                logTestResult('Responsive Design Detection', true, `Detected viewport: ${isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}`);
                passedCount++;
            } catch (error) {
                logTestResult('Responsive Design Detection', false, error.message);
                failedCount++;
            }
        }
        
        // 統合テスト
        async function testIntegration() {
            // データ読み込みからクイズ表示までの流れをテスト
            try {
                const dataLoader = new DataLoader();
                const exams = await dataLoader.getAvailableExams();
                
                if (exams.length > 0) {
                    const examData = await dataLoader.loadExamData(exams[0].id);
                    const quiz = new Quiz(examData.questions, examData.id);
                    const question = quiz.getCurrentQuestion();
                    
                    const passed = question && question.options && Object.keys(question.options).length > 0;
                    logTestResult('Integration: Data Loading to Quiz Creation', passed);
                    if (passed) passedCount++; else failedCount++;
                } else {
                    logTestResult('Integration: Data Loading to Quiz Creation', false, 'No exam data available');
                    failedCount++;
                }
            } catch (error) {
                logTestResult('Integration: Data Loading to Quiz Creation', false, error.message);
                failedCount++;
            }
            
            // ローカルストレージ連携テスト
            try {
                const storageManager = new StorageManager();
                const testKey = 'integration-test';
                const testData = {
                    currentQuestion: 0,
                    answers: [{ questionNumber: '1', selected: 'ア', correct: true }],
                    correctCount: 1,
                    incorrectCount: 0,
                    totalAnswered: 1,
                    totalQuestions: 30,
                    startTime: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                };
                
                // 保存
                const saved = storageManager.saveProgress(testKey, testData);
                
                // 読み込み
                const loaded = storageManager.loadProgress(testKey);
                
                // クリア
                const cleared = storageManager.clearProgress(testKey);
                
                const passed = saved && loaded && loaded.correctCount === 1 && cleared;
                logTestResult('Integration: Local Storage Persistence', passed);
                if (passed) passedCount++; else failedCount++;
            } catch (error) {
                logTestResult('Integration: Local Storage Persistence', false, error.message);
                failedCount++;
            }
        }
    }
    
    // テストを実行
    runTests();
    
    // テスト用のスタイル
    const style = document.createElement('style');
    style.textContent = `
        .test-results {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.95);
            z-index: 9999;
            padding: 20px;
            overflow-y: auto;
        }
        
        .test-results h2 {
            margin-bottom: 20px;
        }
        
        .test-summary {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f5f5f5;
            border-radius: 4px;
        }
        
        .test-result {
            padding: 10px;
            margin-bottom: 5px;
            border-radius: 4px;
        }
        
        .test-result.passed {
            background-color: rgba(46, 204, 113, 0.1);
        }
        
        .test-result.failed {
            background-color: rgba(231, 76, 60, 0.1);
        }
        
        .test-status {
            display: inline-block;
            width: 20px;
            margin-right: 10px;
            font-weight: bold;
        }
        
        .test-result.passed .test-status {
            color: #2ecc71;
        }
        
        .test-result.failed .test-status {
            color: #e74c3c;
        }
        
        .test-name {
            font-weight: bold;
        }
        
        .test-message {
            display: block;
            margin-left: 30px;
            color: #666;
            font-size: 14px;
        }
        
        .test-summary .passed {
            color: #2ecc71;
        }
        
        .test-summary .failed {
            color: #e74c3c;
        }
        
        .error-message {
            color: #e74c3c;
            padding: 10px;
            background-color: rgba(231, 76, 60, 0.1);
            border-radius: 4px;
            margin-bottom: 20px;
        }
        
        #close-tests {
            margin-top: 20px;
        }
    `;
    document.head.appendChild(style);
});