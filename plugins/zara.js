window.zaraPlugin = {
    name: 'zara.com',
    config: {
        priceSelector: '.price-current__amount',
        containerSelector: '.price-current__main',
        currencySymbol: '€'
    },
    helpers: {
        preprocessPrice(price) {
            return price;
        },
        
        insertPrice(container, euroPrice, rubPrice) {
            const roundedPrice = Math.ceil(rubPrice);
            const priceElement = document.createElement('span');
            priceElement.className = 'price-current__amount';
            priceElement.style.display = 'block';
            priceElement.style.marginTop = '5px';
            priceElement.textContent = `${roundedPrice} ₽`;
            container.appendChild(priceElement);
        }
    }
};