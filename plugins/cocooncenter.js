window.cocooncenterPlugin = {
    name: 'cocooncenter.de',
    config: window.SITE_CONFIGS['cocooncenter.de'],
    helpers: {
        preprocessPrice: priceText => priceText?.replace(/&nbsp;/g, ' ').trim().match(/(\d+[,.]\d+)/)?.[1].replace(',', '.'),
        
        insertPrice(container, euroPrice, rubPrice) {
            const span = document.createElement('span');
            span.className = 'rub-price';
            span.textContent = Math.ceil(rubPrice);
            container.parentElement.querySelector('[itemprop="priceCurrency"]')?.after(span);
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = cocooncenterPlugin;
} 