const Config = {
    serverUrl: (window.location.origin && window.location.origin !== 'file://') ? window.location.origin : 'http://127.0.0.1:8081',
    maxMarkers: 50,
    maxDefaultAudioMarkers: 20,
    debounceWait: 300,
    audioListCacheTimeout: 30000,
    apiKey: 'default_api_key'
};
