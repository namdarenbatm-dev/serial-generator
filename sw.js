/* Service worker: پوسته‌ی آفلاین با نسخه‌ی کش. اعلان نسخه‌ی جدید از طریق پیام SKIP_WAITING (بدون بارگذاری مجدد ناخواسته). */
const CACHE = 'psg-v2';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-512-maskable.png', 'assets/Yekan.ttf', 'assets/logo.png', 'src/styles/app.css',
  'src/core/vba.js', 'src/rules/patch-rules.js', 'src/rules/registry.js', 'src/validator/validator.js', 'src/generator/generator.js', 'src/database/idb-store.js',
  'src/services/engine.js', 'src/services/rows.js', 'src/services/analytics.js', 'src/generator/diversity.js', 'src/rules/declarations.js', 'src/components/charts.js', 'src/utils/text.js', 'src/utils/csv.js', 'src/utils/legacy-io.js', 'src/components/ui.js', 'src/components/table.js',
  'src/pages/main.js', 'src/pages/overview.js', 'src/pages/generate.js', 'src/pages/parts.js', 'src/pages/rules.js', 'src/pages/records.js', 'src/pages/duplicates.js', 'src/pages/io.js', 'src/pages/history.js', 'src/pages/diagnostics.js'];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => hit || fetch(r).then(resp => { if (resp && resp.ok) { const cp = resp.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return resp; }).catch(() => caches.match('index.html'))));
});
