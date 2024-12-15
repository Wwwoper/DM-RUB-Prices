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
    const price = parseFloat(priceStr.replace(/[€EUR]/g, '').trim().replace(',', '.'));
    console.log('Получено значение:', price);
    const rubPrice = price * exchangeRate;
    return formatPrice(rubPrice);
}

// Конфигурация селекторов для разных сайтов
const SITE_CONFIGS = {
    'dm.de': {
        priceSelector: '[data-dmid="product-detail-page"] [data-dmid="price-localized"]',
        scriptToWait: 'storeavailability',
        currencySymbol: '€'
    },
    'zara.com': {
        priceSelector: '.price__amount--on-sale .money-amount__main',
        regularPriceSelector: '.price__amount-wrapper .money-amount__main',
        scriptToWait: null,
        currencySymbol: 'EUR',
        delay: 3000,
        alternativePriceSelectors: [
            '.price-current__amount .money-amount__main',
            '[data-qa-qualifier="price-amount-current"] .money-amount__main',
            '.price__amount .money-amount__main'
        ]
    }
};

// Определение текущего сайта
function getCurrentSiteConfig() {
    const hostname = window.location.hostname.replace('www.', '');
    if (hostname.includes('zara.com') && window.location.pathname.includes('/de/')) {
        return SITE_CONFIGS['zara.com'];
    }
    return SITE_CONFIGS[hostname];
}

// Модифицированная функция ожидания загрузки скрипта
async function waitForScript(scriptUrl, config) {
    if (!config.scriptToWait) return Promise.resolve();
    
    return new Promise((resolve) => {
        const checkScript = () => {
            const scripts = document.querySelectorAll('script');
            const found = Array.from(scripts).some(script => 
                script.src && script.src.includes(config.scriptToWait));
            
            if (found) {
                console.log('Скрипт найден');
                setTimeout(resolve, 1000);
            } else {
                setTimeout(checkScript, 100);
            }
        };
        checkScript();
    });
}

// Функция для очистки старых конвертированных цен
function clearOldPrices() {
    document.querySelectorAll('.rub-price').forEach(el => el.remove());
}

// Добавим функцию дебаунсинга
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Модифицированная функция addRubPrice
async function addRubPrice(exchangeRate) {
    console.log('Запуск конвертера цен с курсом:', exchangeRate);

    const config = getCurrentSiteConfig();
    if (!config) {
        console.log('Конфигурация для данного сайта не найдена');
        return;
    }

    clearOldPrices();
    
    // Используем специфичную задержку для сайта или значение по умолчанию
    const delay = config.delay || 1000;
    await new Promise(resolve => setTimeout(resolve, delay));

    // Создаем дебаунсированную функцию обновления цен
    const debouncedUpdate = debounce(async () => {
        const priceElement = await findPrice(config);
        
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
    }, 500); // Задержка в 500мс

    const observer = new MutationObserver((mutations) => {
        // Проверяем, есть ли релевантные изменения
        const hasRelevantChanges = mutations.some(mutation => {
            return mutation.type === 'childList' || 
                   (mutation.type === 'characterData' && 
                    mutation.target.parentElement?.matches(config.priceSelector));
        });

        if (hasRelevantChanges) {
            debouncedUpdate();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });

    // Отслеживание изменений URL с дебаунсингом
    let lastUrl = location.href;
    const debouncedInit = debounce(() => {
        if (location.href !== lastUrl) {
            lastUrl = location.href;
            console.log('URL изменился, обновляем цены');
            clearOldPrices();
            init();
        }
    }, 500);

    const urlObserver = new MutationObserver(debouncedInit);
    urlObserver.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Запускаем первоначальное обновление
    debouncedUpdate();
}

// Модифицированная функция init
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

// Получаем курс из н��строек
async function getExchangeRate() {
    return new Promise((resolve) => {
        chrome.storage.sync.get({
            exchangeRate: 95 // значение по умолчанию
        }, (items) => {
            resolve(items.exchangeRate);
        });
    });
}

// Модифицируем функцию поиска цены
async function findPrice(config) {
    // Сначала ищем акционную цену
    let priceElement = document.querySelector(config.priceSelector);
    
    // Если акционной цены нет, ищем обычную
    if (!priceElement && config.regularPriceSelector) {
        priceElement = document.querySelector(config.regularPriceSelector);
    }
    
    // Если и обычной цены нет, пробуем альтернативные селекторы
    if (!priceElement && config.alternativePriceSelectors) {
        for (const selector of config.alternativePriceSelectors) {
            priceElement = document.querySelector(selector);
            if (priceElement) break;
        }
    }
    
    return priceElement;
}
