const parfumsclubPlugin = {
    name: 'parfumsclub.de',
    config: {
        exchangeRate: 140,
        selectors: [
            '.contPrecioNuevo'  // контейнер с ценой
        ]
    },
    helpers: {
        // Проверка URL страницы
        shouldProcessPage() {
            const currentUrl = window.location.href;
            console.log('🔍 Checking URL:', currentUrl);
            return currentUrl.includes('parfumsclub.de') || 
                   currentUrl.includes('perfumesclub.com');
        },

        convertPrice(priceText) {
            console.log('🔍 Trying to convert price text:', priceText);
            // Очищаем текст от лишних пробелов и символов
            const cleanText = priceText.replace(/\s+/g, ' ').trim();
            const match = cleanText.match(/(\d+[,.]\d+)\s*€/);
            if (!match) {
                console.log('⚠️ No price found in text:', cleanText);
                return null;
            }
            const price = parseFloat(match[1].replace(',', '.'));
            const rubPrice = Math.ceil(price * parfumsclubPlugin.config.exchangeRate);
            console.log('💰 Converting price:', price, '€ →', rubPrice, '₽');
            return rubPrice;
        },
        
        processPrice(priceElement) {
            // Получаем текст, игнорируя вложенные font элементы
            const priceText = Array.from(priceElement.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE || node.nodeName === 'FONT')
                .map(node => node.textContent)
                .join('')
                .trim();
            
            console.log('📝 Processing price element:', priceText);
            
            if (!priceText.includes('€')) {
                console.log('⚠️ No euro symbol found in:', priceText);
                return;
            }
            
            const rubPrice = this.convertPrice(priceText);
            if (!rubPrice) return;
            
            // Создаем новый элемент
            const rubElement = document.createElement('span');
            rubElement.className = 'rub-price';
            rubElement.style.cssText = `
                display: inline-block;
                margin-left: 10px;
                color: #666;
                font-weight: bold;
                font-size: inherit;
            `;
            rubElement.textContent = `${rubPrice} ₽`;
            
            // Находим последний font элемент или сам элемент цены
            const targetElement = priceElement.querySelector('font:last-child') || priceElement;
            
            // Добавляем элемент после цены в евро
            targetElement.insertAdjacentElement('beforeend', rubElement);
            console.log('✅ Added ruble price:', rubPrice, '₽');
        }
    },
    init() {
        console.log('🚀 Initializing parfumsclub plugin');
        
        // Проверяем URL перед запуском
        if (!this.helpers.shouldProcessPage()) {
            console.log('⛔ Wrong URL, plugin stopped');
            return;
        }

        const processPrices = () => {
            console.log('🔄 Starting price processing');
            
            // Удаляем все существующие рублевые цены
            const removedElements = document.querySelectorAll('.rub-price');
            removedElements.forEach(el => el.remove());
            console.log('🗑️ Removed existing prices:', removedElements.length);
            
            // Обрабатываем каждый тип цен отдельно
            this.config.selectors.forEach(selector => {
                const elements = document.querySelectorAll(selector);
                console.log('🎯 Found elements for selector', selector + ':', elements.length);
                
                elements.forEach(priceElement => {
                    const boundProcessPrice = this.helpers.processPrice.bind(this.helpers);
                    boundProcessPrice(priceElement);
                });
            });
        };

        console.log('⏰ Setting up price processing intervals');
        processPrices.call(this);
        setTimeout(() => processPrices.call(this), 1000);
        setTimeout(() => processPrices.call(this), 2000);
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = parfumsclubPlugin;
} else {
    window.parfumsclubPlugin = parfumsclubPlugin;
    console.log('🔌 Parfumsclub plugin loaded');
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('📄 DOM Content Loaded - initializing plugin');
            parfumsclubPlugin.init();
        });
    } else {
        console.log('📄 DOM already loaded - initializing plugin');
        parfumsclubPlugin.init();
    }
} 