self.addEventListener('install', event => {
    console.log('Service Worker: Installed');

    event.waitUntil(
        fetch(self.registration.scope + 'index.html')
            .then(res => res.text())
            .then(async html => {
                const urlsToCache = new Set(['/']); // نضيف الصفحة الرئيسية
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // جمع كل الروابط من link, script, img, وأي حاجة فيها src أو href
                doc.querySelectorAll('link[href], script[src], img[src]').forEach(el => {
                    const url = el.getAttribute('href') || el.getAttribute('src');
                    if (url && !url.startsWith('http')) {
                        urlsToCache.add(url);
                    }
                });

                // إضافة manifest يدويًا لو مش موجود في DOM
                urlsToCache.add('/manifest.json');

                const cache = await caches.open('ravu-cache-v1');
                return await cache.addAll(Array.from(urlsToCache));
            })
            .catch(err => {
                console.error('Error during install caching:', err);
            })
    );
});

self.addEventListener('activate', event => {
    console.log('[SW] Activated 🔥');
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim(); // مهمة جداً برضو
});

// اعتراض الطلبات (fetch) وخدمتها من الكاش إن أمكن
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(res => res || fetch(event.request))
    );
});