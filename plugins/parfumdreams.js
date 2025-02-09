const parfumdreamsPlugin = {
    name: 'parfumdreams.de',
    config: {
        exchangeRate: 140,
        selectors: [
            'span[id^="price_retail_"]',
            'span[id^="price_premium_"]'
        ]
    },
    helpers: {
        convertPrice(priceText) {
            const match = priceText.match(/(\d+[,.]\d+)/);
            if (!match) return null;
            const price = parseFloat(match[1].replace(',', '.'));
            return Math.ceil(price * parfumdreamsPlugin.config.exchangeRate);
        },
        
        processPrice(priceElement) {
            const priceText = priceElement.textContent.trim();
            if (!priceText.includes('€')) return;
            
            const rubPrice = this.convertPrice(priceText);
            if (!rubPrice) return;
            
            // Создаем новый элемент
            const rubElement = document.createElement('span');
            rubElement.className = 'rub-price';
            rubElement.style.cssText = 'margin-left: 5px; color: #666; font-weight: bold;';
            
            // Добавляем префикс "Подписка" для premium цен
            if (priceElement.id.startsWith('price_premium_')) {
                rubElement.textContent = `✔️ ${rubPrice} ₽`;
            } else {
                rubElement.textContent = `✘ ${rubPrice} ₽`;
            }
            
            // Добавляем элемент после цены в евро
            priceElement.parentNode.insertBefore(rubElement, priceElement.nextSibling);
        }
    },
    init() {
        const processPrices = () => {
            // Удаляем все существующие рублевые цены
            document.querySelectorAll('.rub-price').forEach(el => el.remove());
            
            // Обрабатываем каждый тип цен отдельно
            this.config.selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(priceElement => {
                    const boundProcessPrice = this.helpers.processPrice.bind(this.helpers);
                    boundProcessPrice(priceElement);
                });
            });
        };

        processPrices.call(this);
        setTimeout(() => processPrices.call(this), 1000);
        setTimeout(() => processPrices.call(this), 2000);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = parfumdreamsPlugin;
} else {
    window.parfumdreamsPlugin = parfumdreamsPlugin;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            parfumdreamsPlugin.init();
        });
    } else {
        parfumdreamsPlugin.init();
    }
}