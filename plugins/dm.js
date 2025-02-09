window.dmPlugin = {
    name: 'dm.de',
    config: {
        priceSelector: '[data-dmid="product-detail-page"] [data-dmid="price-localized"]',
        containerSelector: '[data-dmid="product-detail-page"]',
        scriptToWait: 'storeavailability',
        currencySymbol: '€'
    },
    helpers: {
        preprocessPrice(price) {
            return price;
        },
        
        insertPrice(container, euroPrice, rubPrice) {
            const roundedPrice = Math.ceil(rubPrice);
            const priceElement = document.createElement('div');
            priceElement.style.fontSize = '1.25rem';
            priceElement.style.marginTop = '0.5rem';
            priceElement.textContent = `${roundedPrice} ₽`;
            container.appendChild(priceElement);
        }
    }
};