/**
 * DataLoader クラス
 * 試験データの読み込みと管理を担当
 */
class DataLoader {
    constructor() {
        this.baseJsonPath = './exam_data/json/';
        this.baseImagePath = './exam_data/images/';
        this.availableExams = [];
        
        // 試験区分の日本語名マッピング
        this.examTypeMap = {
            'koudo': '高度情報技術者試験',
            'pm': 'プロジェクトマネージャー試験'
        };
        
        // 試験セッションの日本語名マッピング
        this.sessionMap = {
            'am1': '午前I',
            'am2': '午前II'
        };
    }

    /**
     * 利用可能な試験データファイル一覧を取得
     * @returns {Promise<Array>} 利用可能な試験データの配列
     */
    async getAvailableExams() {
        try {
            // GitHub Pagesの制約上、静的に定義
            const examIds = [
                '2022r04a_koudo_am1',
                '2022r04a_pm_am2',
                '2023r05a_koudo_am1',
                '2023r05a_pm_am2',
                '2024r06a_koudo_am1',
                '2024r06a_pm_am2'
            ];

            // 試験名を生成
            this.availableExams = examIds.map(id => {
                const parts = id.match(/(\d{4})r(\d{2})a_(.+)_(.+)/);
                if (!parts) return { id, name: id };

                const year = parts[1];
                const round = parts[2];
                const type = parts[3] === 'koudo' ? '高度区分' : 'PM区分';
                const session = parts[4] === 'am1' ? '午前I' : '午前II';

                return {
                    id,
                    name: `${year}年度 ${type} ${session}`
                };
            });

            return this.availableExams;
        } catch (error) {
            console.error('試験データの取得に失敗しました:', error);
            throw error;
        }
    }

    /**
     * 指定された試験データを読み込む
     * @param {string} examId 試験ID
     * @returns {Promise<Object>} 試験データ
     */
    async loadExamData(examId) {
        try {
            // リトライ回数
            const maxRetries = 3;
            let retries = 0;
            let response;
            let withExplanations = false;
            
            // まず解説付きのJSONファイルを試す
            try {
                response = await fetch(`${this.baseJsonPath}${examId}_with_explanations.json`);
                if (response.ok) {
                    withExplanations = true;
                    console.log(`解説付きの試験データ ${examId} を読み込みます。`);
                }
            } catch (e) {
                // 解説付きのファイルがない場合は通常のファイルを使用
                console.log(`解説付きの試験データ ${examId} が見つかりません。通常の試験データを使用します。`);
            }
            
            // 解説付きのファイルがない場合は通常のファイルを使用
            if (!withExplanations) {
                // リトライ処理
                while (retries < maxRetries) {
                    try {
                        response = await fetch(`${this.baseJsonPath}${examId}.json`);
                        
                        if (response.ok) {
                            break;
                        }
                        
                        // 404エラーの場合はリトライしない
                        if (response.status === 404) {
                            throw new Error(`試験データ ${examId} が見つかりません。`);
                        }
                        
                        // その他のエラーの場合はリトライ
                        retries++;
                        
                        if (retries < maxRetries) {
                            // 指数バックオフ（リトライ間隔を徐々に長くする）
                            const delay = Math.pow(2, retries) * 500;
                            await new Promise(resolve => setTimeout(resolve, delay));
                        }
                    } catch (fetchError) {
                        // ネットワークエラーの場合はリトライ
                        retries++;
                        
                        if (retries >= maxRetries) {
                            throw fetchError;
                        }
                        
                        // 指数バックオフ
                        const delay = Math.pow(2, retries) * 500;
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            
            // 最大リトライ回数を超えた場合
            if (!response || !response.ok) {
                throw new Error(`試験データ ${examId} の読み込みに失敗しました。ネットワーク接続を確認してください。`);
            }
            
            // JSONデータの解析
            let questions;
            try {
                questions = await response.json();
            } catch (jsonError) {
                throw new Error(`試験データ ${examId} の解析に失敗しました。データが破損している可能性があります。`);
            }
            
            // データの検証
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error(`試験データ ${examId} が空か、正しい形式ではありません。`);
            }
            
            // 試験情報を追加
            const examInfo = this.availableExams.find(exam => exam.id === examId) || { name: examId };
            
            // 各問題に画像情報を追加
            const processedQuestions = await Promise.all(questions.map(async question => {
                try {
                    // 画像の有無を確認
                    const hasQuestionImage = await this.checkImageExists(
                        this.resolveImagePath(examId, question.number)
                    );
                    
                    // 選択肢の画像を確認
                    const optionImages = {};
                    let hasOptionImages = false;
                    
                    for (const option of Object.keys(question.options)) {
                        const optionImagePath = this.resolveImagePath(examId, question.number, option);
                        const optionImageExists = await this.checkImageExists(optionImagePath);
                        
                        if (optionImageExists) {
                            optionImages[option] = optionImagePath;
                            hasOptionImages = true;
                        }
                    }
                    
                    // 画像情報を追加
                    return {
                        ...question,
                        hasImages: hasQuestionImage || hasOptionImages,
                        imagePaths: {
                            ...(hasQuestionImage ? { question: this.resolveImagePath(examId, question.number) } : {}),
                            ...optionImages
                        }
                    };
                } catch (imageError) {
                    // 画像情報の取得に失敗した場合でも、問題自体は返す
                    console.warn(`問題 ${question.number} の画像情報の取得に失敗しました:`, imageError);
                    return {
                        ...question,
                        hasImages: false,
                        imagePaths: {}
                    };
                }
            }));
            
            return {
                id: examId,
                name: examInfo.name,
                questions: processedQuestions,
                hasExplanations: withExplanations
            };
        } catch (error) {
            console.error(`試験データ ${examId} の読み込みに失敗しました:`, error);
            throw error;
        }
    }

    /**
     * 画像パスの解決
     * @param {string} examId 試験ID
     * @param {string} questionNumber 問題番号
     * @param {string} option 選択肢（オプション）
     * @returns {string} 画像パス
     */
    resolveImagePath(examId, questionNumber, option = null) {
        // ランダム出題の場合は元の試験IDを使用
        if (examId === 'random' && questionNumber.examId) {
            examId = questionNumber.examId;
            questionNumber = questionNumber.number;
        }
        
        // 問題番号を2桁にパディング
        const paddedNumber = String(questionNumber).padStart(2, '0');
        
        // 選択肢がある場合は選択肢を含むパスを返す
        if (option) {
            return `${this.baseImagePath}${examId}/q${paddedNumber}_${option}.png`;
        }
        
        // 問題本体の画像パス
        return `${this.baseImagePath}${examId}/q${paddedNumber}.png`;
    }

    /**
     * 画像の存在確認
     * @param {string} imagePath 画像パス
     * @returns {Promise<boolean>} 画像が存在するかどうか
     */
    async checkImageExists(imagePath) {
        try {
            // 実際の環境では HEAD リクエストを使用するが、
            // GitHub Pages では CORS の制約があるため、画像の存在を確認する別の方法を使用
            // ここでは、画像を読み込んでみて、エラーが発生しなければ存在すると判断
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = imagePath;
            });
        } catch (error) {
            console.error('画像の存在確認に失敗しました:', error);
            return false;
        }
    }
    
    /**
     * 問題に関連する画像を事前に読み込む
     * @param {Object} question 問題データ
     * @param {string} examId 試験ID
     * @returns {Promise<void>}
     */
    async preloadQuestionImages(question, examId) {
        if (!question.hasImages) return;
        
        const imagePaths = [];
        
        // 問題本体の画像
        if (question.imagePaths && question.imagePaths.question) {
            imagePaths.push(question.imagePaths.question);
        } else {
            imagePaths.push(this.resolveImagePath(examId, question.number));
        }
        
        // 選択肢の画像
        if (question.imagePaths) {
            Object.entries(question.imagePaths).forEach(([key, path]) => {
                if (key !== 'question') {
                    imagePaths.push(path);
                }
            });
        } else {
            // 選択肢ごとに画像パスを生成
            Object.keys(question.options).forEach(option => {
                imagePaths.push(this.resolveImagePath(examId, question.number, option));
            });
        }
        
        // 画像を事前に読み込む
        await Promise.all(imagePaths.map(path => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve();
                img.onerror = () => resolve();
                img.src = path;
            });
        }));
    }
    
    /**
     * 試験IDから出典情報を生成する
     * @param {string} examId 試験ID
     * @param {string} questionNumber 問題番号
     * @returns {string} 出典情報
     */
    generateCitation(examId, questionNumber) {
        // ランダム出題の場合は元の試験IDを使用
        if (examId === 'random' && questionNumber.examId) {
            examId = questionNumber.examId;
            questionNumber = questionNumber.number;
        }
        
        // 試験IDをパースして情報を抽出
        const parts = examId.match(/(\d{4})r(\d{2})a_(.+)_(.+)/);
        if (!parts) return `出典：問${questionNumber}`;
        
        const year = parts[1];
        const round = parts[2];
        const type = parts[3];
        const session = parts[4];
        
        // 年号を和暦に変換
        const japaneseYear = this.convertToJapaneseYear(parseInt(year));
        
        // 試験区分の日本語名を取得
        const examType = this.examTypeMap[type] || type;
        
        // 試験セッションの日本語名を取得
        const examSession = this.sessionMap[session] || session;
        
        // 出典情報を生成
        return `出典：${japaneseYear}年度 ${round}回 ${examType} ${examSession} 問${questionNumber}`;
    }
    
    /**
     * 西暦を和暦に変換
     * @param {number} year 西暦
     * @returns {string} 和暦
     */
    convertToJapaneseYear(year) {
        if (year >= 2019) {
            return `令和${year - 2018}`;
        } else if (year >= 1989) {
            return `平成${year - 1988}`;
        } else if (year >= 1926) {
            return `昭和${year - 1925}`;
        } else {
            return `${year}`;
        }
    }
}