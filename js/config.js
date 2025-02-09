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
        priceSelector: '.price__amount--on-sale .money-amount__main',
        containerSelector: '.price__amount-wrapper',
        regularPriceSelector: '.price__amount-wrapper .money-amount__main',
        scriptToWait: null,
        currencySymbol: 'EUR',
        delay: 3000,
        alternativePriceSelectors: [
            '.price-current__amount .money-amount__main',
            '[data-qa-qualifier="price-amount-current"] .money-amount__main',
            '.price__amount .money-amount__main'
        ]
    },
    'ikea.com': {
        priceSelector: '.pip-price-module__price',
        containerSelector: '.pip-price-module__primary-currency-price',
        currencySymbol: '€',
        delay: 1000
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