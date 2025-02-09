window.parfumsclubPlugin = {
    name: 'parfumsclub.de',
    config: window.SITE_CONFIGS['parfumsclub.de'],
    helpers: {
        preprocessPrice: priceText => {
            if (!priceText) return null;
            const match = priceText.match(/(\d+[,.]\d+)/);
            return match ? match[1].replace(',', '.') : null;
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = parfumsclubPlugin;
} else {
    window.parfumsclubPlugin = parfumsclubPlugin;
} 