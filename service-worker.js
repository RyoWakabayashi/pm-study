// サービスワーカーのバージョン
const CACHE_VERSION = 'v1';
const CACHE_NAME = `pm-exam-quiz-${CACHE_VERSION}`;

// キャッシュするファイル
const CACHE_FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/app.js',
  './js/data-loader.js',
  './js/quiz.js',
  './js/storage.js',
  './manifest.json'
];

// インストール時にキャッシュを作成
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('キャッシュを作成しました');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('古いキャッシュを削除しました:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチイベントの処理
self.addEventListener('fetch', event => {
  // JSONファイルとイメージファイルは常に最新を取得
  if (event.request.url.includes('/exam_data/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // オフライン時はキャッシュから取得
          return caches.match(event.request);
        })
    );
  } else {
    // その他のファイルはキャッシュファーストで取得
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // キャッシュがあればそれを返す
          if (response) {
            return response;
          }
          
          // キャッシュがなければネットワークから取得
          return fetch(event.request).then(response => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
            
            return response;
          });
        })
        .catch(() => {
          // オフライン時の対応
          if (event.request.url.includes('/index.html') || event.request.url.endsWith('/')) {
            return caches.match('./index.html');
          }
        })
    );
  }
});