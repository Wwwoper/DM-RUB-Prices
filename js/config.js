// Схема валидации конфигурации
const configSchema = {
    priceSelector: 'string',
    containerSelector: 'string?',
    regularPriceSelector: 'string?',
    scriptToWait: 'string?',
    currencySymbol: 'string',
    delay: 'number?',
    alternativePriceSelectors: 'array?'
};

// Функция валидации конфигурации
function validateConfig(config, schema) {
    for (const [key, type] of Object.entries(schema)) {
        const isOptional = type.endsWith('?');
        const baseType = type.replace('?', '');
        
        if (!isOptional && !(key in config)) {
            throw new Error(`Отсутствует обязательное поле: ${key}`);
        }
        
        if (key in config && config[key] !== null) {
            const actualType = Array.isArray(config[key]) ? 'array' : typeof config[key];
            if (actualType !== baseType) {
                throw new Error(`Неверный тип для ${key}: ожидается ${baseType}, получен ${actualType}`);
            }
        }
    }
    return true;
}

// Конфигурация сайтов
const SITE_CONFIGS = {
    'dm.de': {
        priceSelector: '[data-dmid="product-detail-page"] [data-dmid="price-localized"]',
        containerSelector: '[data-dmid="product-detail-page"]',
        scriptToWait: 'storeavailability',
        currencySymbol: '€'
    },
    'zara.com': {
        priceSelector: '.product-detail-info__price [data-qa-qualifier="price-amount-current"] .money-amount__main',
        containerSelector: '.product-detail-info__price .money-amount__main',
        currencySymbol: '€',
        delay: 3000,
        dynamicUpdate: true,
        observeConfig: {
            childList: true,
            subtree: true
        },
        observeTarget: '.product-detail-info__price',
        alternativePriceSelectors: [
            '.product-detail-info__price .price-current__amount .money-amount__main',
            '.product-detail-info__price [data-qa-qualifier="price-amount-current"] .money-amount__main'
        ]
    },
    'ikea.com': {
        priceSelector: '.pip-price-module__price',
        containerSelector: '.pip-price-module__primary-currency-price',
        currencySymbol: '€',
        delay: 1000
    },
    'cocooncenter.de': {
        priceSelector: '.prix_fiche_produit [itemprop="price"]',
        containerSelector: '.prix_fiche_produit',
        currencySymbol: '€',
        delay: 2000
    },
    'parfumsclub.de': {
        priceSelector: '#listPrices .contPrecioNuevo',
        containerSelector: '#listPrices',
        currencySymbol: '€',
        delay: 2000
    }
};

// Валидация всех конфигураций
Object.entries(SITE_CONFIGS).forEach(([site, config]) => {
    try {
        validateConfig(config, configSchema);
    } catch (error) {
        console.error(`Ошибка в конфигурации для ${site}:`, error);
        throw error;
    }
});

// Делаем доступным в глобальной области видимости
window.SITE_CONFIGS = SITE_CONFIGS; 