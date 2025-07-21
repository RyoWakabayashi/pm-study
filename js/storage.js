/**
 * StorageManager クラス
 * ローカルストレージでの進捗管理を担当
 */
class StorageManager {
    constructor() {
        this.storageKey = 'pm-exam-quiz-progress';
    }

    /**
     * 進捗を保存
     * @param {string} examId 試験ID
     * @param {Object} progress 進捗情報
     */
    saveProgress(examId, progress) {
        try {
            // 現在の全進捗データを取得
            const allProgress = this.getAllProgress();
            
            // 指定された試験の進捗を更新
            allProgress[examId] = {
                ...progress,
                lastUpdated: new Date().toISOString()
            };
            
            // ローカルストレージに保存
            localStorage.setItem(this.storageKey, JSON.stringify(allProgress));
            
            return true;
        } catch (error) {
            console.error('進捗の保存に失敗しました:', error);
            
            // ストレージ容量不足の場合は古いデータを削除して再試行
            if (error instanceof DOMException && error.name === 'QuotaExceededError') {
                this.cleanupOldData();
                return this.saveProgress(examId, progress);
            }
            
            return false;
        }
    }

    /**
     * 進捗を読み込み
     * @param {string} examId 試験ID
     * @returns {Object|null} 進捗情報
     */
    loadProgress(examId) {
        try {
            const allProgress = this.getAllProgress();
            return allProgress[examId] || null;
        } catch (error) {
            console.error('進捗の読み込みに失敗しました:', error);
            return null;
        }
    }

    /**
     * 進捗をクリア
     * @param {string} examId 試験ID
     */
    clearProgress(examId) {
        try {
            const allProgress = this.getAllProgress();
            
            if (allProgress[examId]) {
                delete allProgress[examId];
                localStorage.setItem(this.storageKey, JSON.stringify(allProgress));
            }
            
            return true;
        } catch (error) {
            console.error('進捗のクリアに失敗しました:', error);
            return false;
        }
    }

    /**
     * 全ての進捗データを取得
     * @returns {Object} 全ての進捗データ
     */
    getAllProgress() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('進捗データの取得に失敗しました:', error);
            return {};
        }
    }

    /**
     * 古いデータを削除
     */
    cleanupOldData() {
        try {
            const allProgress = this.getAllProgress();
            const entries = Object.entries(allProgress);
            
            // 最終更新日時でソート
            entries.sort((a, b) => {
                const dateA = new Date(a[1].lastUpdated || 0);
                const dateB = new Date(b[1].lastUpdated || 0);
                return dateA - dateB;
            });
            
            // 最も古い半分を削除
            const toKeep = entries.slice(Math.floor(entries.length / 2));
            const newProgress = Object.fromEntries(toKeep);
            
            localStorage.setItem(this.storageKey, JSON.stringify(newProgress));
        } catch (error) {
            console.error('古いデータの削除に失敗しました:', error);
            // 最終手段としてストレージをクリア
            localStorage.removeItem(this.storageKey);
        }
    }
}