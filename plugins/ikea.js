window.ikeaPlugin = {
    name: 'ikea.com',
    config: {
        priceSelector: '.pip-price-module__price',
        containerSelector: '.pip-price-module__primary-currency-price',
        currencySymbol: '€'
    },
    helpers: {
        preprocessPrice(price) {
            // Находим все компоненты цены
            const integer = price.querySelector('.pip-price__integer')?.textContent || '0';
            const decimal = price.querySelector('.pip-price__decimal')?.textContent || '00';
            
            // Собираем полную цену
            return `${integer}${decimal}`;
        },
        
        // Добавляем метод для вставки цены в рублях
        insertPrice(container, euroPrice, rubPrice) {
            // Создаем элемент для цены в рублях в стиле IKEA
            const rubPriceElement = document.createElement('span');
            rubPriceElement.className = 'pip-price pip-price--trailing pip-price--medium pip-price--currency-base-aligned pip-price--decimal-super-aligned pip-price-module__current-price';
            rubPriceElement.style.display = 'block';
            rubPriceElement.style.marginTop = '5px';
            
            // Округляем цену в большую сторону
            const roundedPrice = Math.ceil(rubPrice);
            
            // Создаем структуру HTML как у оригинальной цены IKEA
            const ariaHiddenSpan = document.createElement('span');
            ariaHiddenSpan.setAttribute('aria-hidden', 'true');
            ariaHiddenSpan.className = 'notranslate';
            
            ariaHiddenSpan.innerHTML = `
                <span class="pip-price__nowrap">
                    <span class="pip-price__integer">${roundedPrice}</span>
                </span>
                <span class="pip-price__currency">₽</span>
            `;
            
            // Добавляем скрытый текст для скринридеров
            const srText = document.createElement('span');
            srText.className = 'pip-price__sr-text';
            srText.textContent = `Price ${roundedPrice}₽`;
            
            // Собираем элемент
            rubPriceElement.appendChild(ariaHiddenSpan);
            rubPriceElement.appendChild(srText);
            
            // Добавляем цену в рублях после цены в евро
            container.appendChild(rubPriceElement);
        }
    }
};
