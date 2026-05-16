// 站点配置。
// serverUrl: 当页面通过 http(s) 加载时同源；通过 file:// 加载时回退到本地后端
// 端口（默认 10000，可通过 ?api=http://host:port 覆盖）。
(function () {
    const origin = window.location.origin;
    const isHttp = typeof origin === 'string' && /^https?:/.test(origin);

    // 允许 ?api=http://localhost:PORT 临时覆盖，方便调试
    const params = new URLSearchParams(window.location.search);
    const override = params.get('api');

    const serverUrl = override || (isHttp ? origin : 'http://127.0.0.1:10000');

    window.Config = {
        serverUrl,
        maxMarkers: 50,
        maxDefaultAudioMarkers: 20,
        debounceWait: 300,
        audioListCacheTimeout: 30000,
        apiKey: 'default_api_key',

        // file:// 下需要拼上 serverUrl，避免落到 file:///C:/default_audio/...
        resolveUrl(path) {
            if (!path) return path;
            if (/^(?:https?:|data:|blob:)/.test(path)) return path;
            if (path.startsWith('/') && !isHttp) return serverUrl + path;
            return path;
        }
    };
})();
