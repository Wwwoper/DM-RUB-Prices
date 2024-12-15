console.log('Content script loaded');

// Функция форматирования цены
function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(price);
}

// Функция для конвертации цены
function convertPrice(priceStr, exchangeRate) {
    console.log('Конвертируем цену:', priceStr);
    const price = parseFloat(priceStr.replace('€', '').trim().replace(',', '.'));
    console.log('Получено значение:', price);
    const rubPrice = price * exchangeRate;
    return formatPrice(rubPrice);
}

// Функция ожидания загрузки скрипта
function waitForScript(scriptUrl) {
    return new Promise((resolve) => {
        const checkScript = () => {
            const scripts = document.querySelectorAll('script');
            const found = Array.from(scripts).some(script => 
                script.src && script.src.includes('storeavailability'));
            
            if (found) {
                console.log('Скрипт доступности найден');
                setTimeout(resolve, 1000);
            } else {
                setTimeout(checkScript, 100);
            }
        };
        checkScript();
    });
}

// Функция для добавления цены в рублях
async function addRubPrice(exchangeRate) {
    console.log('Запуск конвертера цен с курсом:', exchangeRate);

    await waitForScript('storeavailability');
    console.log('Скрипт загружен, начинаем наблюдение за ценами');

    const observer = new MutationObserver((mutations, obs) => {
        const priceElement = document.querySelector('[data-dmid="product-detail-page"] [data-dmid="price-localized"]');
        
        if (priceElement && !priceElement.nextElementSibling?.classList.contains('rub-price')) {
            console.log('Найден элемент с ценой:', priceElement.textContent);
            
            const euroPrice = priceElement.textContent;
            const rubPrice = convertPrice(euroPrice, exchangeRate);
            
            const rubPriceElement = document.createElement('span');
            rubPriceElement.className = 'rub-price';
            rubPriceElement.textContent = rubPrice;
            
            priceElement.parentNode.insertBefore(rubPriceElement, priceElement.nextSibling);
            console.log('Добавлена цена в рублях:', rubPrice);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    console.log('Наблюдатель за ценами запущен');
}

// Запускаем основной код
const init = async () => {
    console.log('Инициализация конвертера цен');
    const exchangeRate = await getExchangeRate();
    
    try {
        await addRubPrice(exchangeRate);
    } catch (error) {
        console.error('Ошибка в конвертере цен:', error);
    }
};

// Запускаем инициализацию когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Получаем курс из настроек
async function getExchangeRate() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            exchangeRate: 95 // значение по умолчанию
        }, (items) => {
            resolve(items.exchangeRate);
        });
    });
}
