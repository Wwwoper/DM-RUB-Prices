const cocooncenterPlugin = {
    name: 'cocooncenter.de',
    config: {
        exchangeRate: 140,
        selectors: [
            '[id^="prix_fiche_produit_"]', // Основной селектор цены для любого ID
            '.prix_fiche_produit span[itemprop="price"]' // Альтернативный селектор
        ]
    },

    helpers: {
        convertPrice(priceText) {
            // Извлекаем число из строки, учитывая немецкий формат (запятая вместо точки)
            const match = priceText.match(/(\d+[,.]\d+)/);
            if (!match) return null;
            const price = parseFloat(match[1].replace(',', '.'));
            return Math.ceil(price * cocooncenterPlugin.config.exchangeRate);
        },
        
        processPrice(priceElement) {
            const priceText = priceElement.textContent.trim();
            if (!priceText.includes('€')) return;
            
            const rubPrice = this.convertPrice(priceText);
            if (!rubPrice) return;
            
            // Удаляем существующий элемент с рублевой ценой, если есть
            const existingRubPrice = priceElement.parentNode.querySelector('.rub-price');
            if (existingRubPrice) {
                existingRubPrice.remove();
            }
            
            // Создаем элемент для отображения цены в рублях
            const rubElement = document.createElement('span');
            rubElement.className = 'rub-price';
            rubElement.style.cssText = 'display: inline-block; margin-left: 5px; color: #666; font-weight: bold;';
            rubElement.textContent = `${rubPrice} ₽`;
            
            // Добавляем после элемента с ценой
            priceElement.parentNode.insertBefore(rubElement, priceElement.nextSibling);
        }
    },

    init() {
        const processPrices = () => {
            // Удаляем все существующие рублевые цены
            document.querySelectorAll('.rub-price').forEach(el => el.remove());
            
            // Обрабатываем цены для каждого селектора
            this.config.selectors.forEach(selector => {
                document.querySelectorAll(selector).forEach(priceElement => {
                    const boundProcessPrice = this.helpers.processPrice.bind(this.helpers);
                    boundProcessPrice(priceElement);
                });
            });
        };

        // Запускаем обработку цен сразу и с задержкой
        processPrices.call(this);
        setTimeout(() => processPrices.call(this), 1000);
        setTimeout(() => processPrices.call(this), 2000);
    }
};

// Экспорт для Node.js или запуск в браузере
if (typeof module !== 'undefined' && module.exports) {
    module.exports = cocooncenterPlugin;
} else {
    window.cocooncenterPlugin = cocooncenterPlugin;
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            cocooncenterPlugin.init();
        });
    } else {
        cocooncenterPlugin.init();
    }
} 