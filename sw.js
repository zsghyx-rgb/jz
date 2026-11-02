/* 记一笔 · Service Worker
 * 与 index.html v3.8.x 配套（页面里通过 navigator.serviceWorker.register('sw.js') 注册）
 *
 * 策略：
 *  1. 应用外壳（index.html / manifest.json / 图标）：网络优先（3 秒超时），失败回退缓存 → 联网时总能拿到最新版，断网也能打开
 *  2. CDN（Bootstrap / Bootstrap Icons / CryptoJS / Chart.js）：带版本号的 URL 缓存优先；不带版本号的（chart.js）先读缓存、后台更新
 *  3. 数据请求一律不拦截、不缓存：Google Apps Script、Supabase、Google Drive 附件等都直接走网络
 *     （账目数据是加密文件/密文行，同步状态由 App 自己管理，不能被 SW 缓存）
 *
 * 发布新版本时：只要改一下下面的 APP_VERSION（与 index.html 里的 APP_VERSION 保持一致），旧缓存会在激活时自动清理。
 */
const APP_VERSION = '3.8.2';
const SHELL_CACHE = `jibi-shell-v${APP_VERSION}`;
const CDN_CACHE = 'jibi-cdn-v1';   // CDN 资源带版本号，长期有效，不随 APP_VERSION 清理

const SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
];

const CDN_URLS = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js',
  'https://cdn.jsdelivr.net/npm/chart.js',
];

// 这些域名永远走网络，SW 不介入
const BYPASS_HOSTS = [
  'script.google.com',
  'script.googleusercontent.com',
  'drive.google.com',
  'docs.google.com',
  'lh3.googleusercontent.com',
  'www.googleapis.com',
  'accounts.google.com',
];
const BYPASS_SUFFIXES = ['.supabase.co', '.supabase.in'];

function shouldBypass(url) {
  const h = url.hostname;
  return BYPASS_HOSTS.includes(h) || BYPASS_SUFFIXES.some(s => h.endsWith(s));
}

/* ───────── 安装：预缓存外壳与 CDN（单个失败不影响整体安装） ───────── */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL_CACHE);
    const cdn = await caches.open(CDN_CACHE);
    await Promise.all([
      ...SHELL_URLS.map(u => shell.add(new Request(u, { cache: 'reload' })).catch(() => {})),
      ...CDN_URLS.map(async u => {
        if (await cdn.match(u)) return;               // 已经缓存过就不重复下载
        await cdn.add(u).catch(() => {});
      }),
    ]);
    await self.skipWaiting();
  })());
});

/* ───────── 激活：清理旧版本外壳缓存，立即接管页面 ───────── */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(k => k.startsWith('jibi-shell-') && k !== SHELL_CACHE)
      .map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ───────── 请求拦截 ───────── */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;                    // POST（同步上传/附件上传）一律放行
  const url = new URL(req.url);
  if (!/^https?:$/.test(url.protocol)) return;
  if (shouldBypass(url)) return;                        // 数据/附件请求：直接走网络

  // 页面导航 或 同源外壳资源：网络优先 + 缓存兜底
  if (req.mode === 'navigate' || url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, event));
    return;
  }

  // CDN
  if (url.hostname === 'cdn.jsdelivr.net') {
    const versioned = /@\d+\.\d+/.test(url.pathname);   // 路径里带版本号 → 内容不会变，缓存优先
    event.respondWith(versioned ? cacheFirst(req) : staleWhileRevalidate(req, event));
  }
  // 其他跨域资源：不处理，浏览器默认行为
});

async function networkFirst(req, event) {
  const cache = await caches.open(SHELL_CACHE);
  try {
    const res = await timeout(fetch(req), 3000);
    if (res && res.ok && res.type === 'basic') cache.put(req, res.clone());
    return res;
  } catch (_) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === 'navigate') {
      const shell = (await cache.match('./index.html')) || (await cache.match('./'));
      if (shell) return shell;
    }
    // 超时但缓存里也没有：再等一次真实网络结果
    return fetch(req);
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CDN_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req, event) {
  const cache = await caches.open(CDN_CACHE);
  const hit = await cache.match(req);
  const refresh = fetch(req).then(res => {
    if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  if (hit) { event.waitUntil(refresh); return hit; }
  return (await refresh) || Response.error();
}

function timeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}
