const parfumsclubPlugin = {
    name: 'parfumsclub.de',
    config: {
        exchangeRate: 140,
        selector: '.contPrecioNuevo'  // один основной селектор
    },

    convertPrice(priceText) {
        const price = parseFloat(priceText.match(/(\d+[,.]\d+)/)[1].replace(',', '.'));
        return Math.ceil(price * this.config.exchangeRate);
    },

    processPrice(priceElement) {
        const priceText = priceElement.textContent.trim();
        if (!priceText.includes('€')) return;

        try {
            const rubPrice = this.convertPrice(priceText);
            const rubElement = document.createElement('span');
            rubElement.className = 'rub-price';
            rubElement.style.cssText = 'display: inline-block; margin-left: 10px; color: #666; font-weight: bold;';
            rubElement.textContent = `${rubPrice} ₽`;
            
            const targetElement = priceElement.querySelector('font:last-child') || priceElement;
            targetElement.insertAdjacentElement('beforeend', rubElement);
        } catch (error) {
            console.warn('Failed to process price:', priceText, error);
        }
    },

    init() {
        if (!window.location.href.includes('parfumsclub.de') && 
            !window.location.href.includes('perfumesclub.com')) return;

        const updatePrices = () => {
            document.querySelectorAll('.rub-price').forEach(el => el.remove());
            document.querySelectorAll(this.config.selector).forEach(el => 
                this.processPrice.bind(this)(el)
            );
        };

        // Запускаем обновление цен сразу и через небольшие интервалы
        updatePrices();
        [1000, 2000].forEach(ms => setTimeout(updatePrices, ms));
    }
};

// Автозапуск плагина
if (typeof module !== 'undefined' && module.exports) {
    module.exports = parfumsclubPlugin;
} else {
    window.parfumsclubPlugin = parfumsclubPlugin;
    document.readyState === 'loading' 
        ? document.addEventListener('DOMContentLoaded', () => parfumsclubPlugin.init())
        : parfumsclubPlugin.init();
} 