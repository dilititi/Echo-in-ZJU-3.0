const Utils = {
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    validateUrl(url) {
        try {
            if (url.startsWith('/')) return true;
            const parsedUrl = new URL(url);
            return parsedUrl.origin === window.location.origin || 
                   parsedUrl.origin === 'http://localhost:8000' || 
                   parsedUrl.origin === 'http://127.0.0.1:8080';
        } catch {
            return false;
        }
    },

    validateAudioKey(key) {
        return typeof key === 'string' && /^audio\/[a-zA-Z0-9_\-\/\.]+$/.test(key);
    },

    validateAudioName(name) {
        if (!name || name.trim() === '') return '音频名称不能为空';
        if (name.length > 50) return '音频名称不能超过50个字符';
        if (name.includes('..') || name.includes('/') || name.includes('\\')) {
            return '音频名称不能包含路径字符';
        }
        return null;
    }
};
