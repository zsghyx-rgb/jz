// @file js/boot-head.js
// 页面最早执行：跟随系统深浅色(data-bs-theme)、禁用 iOS 双指缩放和双击放大。必须在 <head> 同步加载，避免闪白屏。

        (() => {
            const setTheme = theme => {
                if (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.setAttribute('data-bs-theme', 'dark')
                } else {
                    document.documentElement.setAttribute('data-bs-theme', theme)
                }
            }
            setTheme('auto')
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTheme('auto'))
        })()

        document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
        document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
        document.addEventListener('gestureend', function(e) { e.preventDefault(); });

        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) { event.preventDefault(); }
            lastTouchEnd = now;
        }, false);
