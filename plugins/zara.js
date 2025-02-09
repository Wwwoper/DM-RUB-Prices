window.zaraPlugin = {
    name: 'zara.com',
    config: window.SITE_CONFIGS['zara.com'],
    helpers: {
        preprocessPrice(price) {
            return price;
        },
        
        insertPrice(container, euroPrice, rubPrice) {
            try {
                // Проверяем, что контейнер существует и находится в основном блоке товара
                if (!container || !container.closest('.product-detail-info__price')) {
                    return;
                }

                const priceElement = document.createElement('div');
                priceElement.className = 'money-amount__price rub-price';
                priceElement.style.cssText = 'font-size: 14px; color: #666; margin-top: 4px;';
                priceElement.textContent = `${Math.round(rubPrice)} ₽`;

                const priceContainer = container.closest('.money-amount');
                const existingRubPrice = priceContainer?.querySelector('.rub-price');
                
                if (existingRubPrice) {
                    existingRubPrice.remove();
                }

                priceContainer?.appendChild(priceElement);
            } catch (error) {
                console.error('Error inserting price:', error);
            }
            
            this.setupUrlObserver();
        },

        setupUrlObserver() {
            if (!window.urlObserver) {
                let lastUrl = location.href;
                const self = this; // Сохраняем контекст
                
                window.urlObserver = setInterval(() => {
                    try {
                        if (location.href !== lastUrl) {
                            lastUrl = location.href;
                            
                            // Удаляем флаги обработки при смене URL
                            const processedElements = document.querySelectorAll('[data-rub-price-processed]');
                            processedElements.forEach(el => {
                                el.removeAttribute('data-rub-price-processed');
                            });
                            
                            setTimeout(() => {
                                // Ищем цену только в основном блоке товара
                                const mainPriceBlock = document.querySelector('.product-detail-info__price');
                                if (!mainPriceBlock) return;

                                const priceElement = mainPriceBlock.querySelector('[data-qa-qualifier="price-amount-current"] .money-amount__main');
                                
                                if (priceElement) {
                                    const match = priceElement.textContent.trim().match(/(\d+[.,]\d+)\s*EUR/);
                                    if (match) {
                                        const euroPrice = parseFloat(match[1].replace(',', '.'));
                                        self.insertPrice(priceElement, euroPrice, euroPrice * 140);
                                        priceElement.setAttribute('data-rub-price-processed', 'true');
                                    }
                                }
                            }, 1500);
                        }
                    } catch (error) {
                        console.error('Error in URL observer:', error);
                    }
                }, 500);
            }
        }
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = zaraPlugin;
}