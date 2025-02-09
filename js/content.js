console.log('Content script loaded');

// Конфигурация логирования
const DEBUG = true;
const log = (...args) => DEBUG && console.log('🔍 [RUB Prices]:', ...args);
const warn = (...args) => DEBUG && console.warn('⚠️ [RUB Prices]:', ...args);
const error = (...args) => console.error('❌ [RUB Prices]:', ...args);

// Объект для работы с валютами
const CurrencyConverter = {
    formatPrice(price) {
        return Math.ceil(price);
    },

    convertPrice(priceText, exchangeRate) {
        const processedPrice = priceText.replace(/\s+/g, ' ').trim();
        const price = parseFloat(processedPrice.replace(/[€EUR]/g, '').trim().replace(',', '.'));
        return this.formatPrice(price * exchangeRate);
    },

    async getExchangeRate() {
        return new Promise((resolve) => {
            chrome.storage.sync.get({ exchangeRate: 95 }, (items) => resolve(items.exchangeRate));
        });
    }
};

// Объект для работы с DOM
const DOMHandler = {
    clearOldPrices() {
        document.querySelectorAll('.rub-price').forEach(el => el.remove());
        document.querySelectorAll('[data-rub-price]').forEach(el => {
            delete el.dataset.rubPrice;
        });
    },

    createPriceElement(price) {
        const element = document.createElement('span');
        element.className = 'rub-price';
        element.textContent = price;
        return element;
    },

    findPriceElement(config) {
        let element = document.querySelector(config.priceSelector);
        
        if (!element && config.regularPriceSelector) {
            element = document.querySelector(config.regularPriceSelector);
        }
        
        if (!element && config.alternativePriceSelectors) {
            for (const selector of config.alternativePriceSelectors) {
                element = document.querySelector(selector);
                if (element) break;
            }
        }
        
        return element;
    },

    addConvertedPrice(priceElement, exchangeRate) {
        if (!priceElement || !priceElement.textContent?.trim() || priceElement.dataset.rubPrice) {
            return false;
        }

        try {
            const rubPrice = CurrencyConverter.convertPrice(priceElement.textContent, exchangeRate);
            const rubPriceElement = this.createPriceElement(rubPrice);
            
            priceElement.dataset.rubPrice = 'true';
            
            if (priceElement.parentNode) {
                priceElement.parentNode.insertBefore(rubPriceElement, priceElement.nextSibling);
                return true;
            }
        } catch (err) {
            delete priceElement.dataset.rubPrice;
        }
        
        return false;
    }
};

// Получение конфигурации с учетом плагинов
function getCurrentSiteConfig() {
    const hostname = window.location.hostname.replace('www.', '');
    return window.pluginManager.getConfig(hostname);
}

// Получение хелперов для текущего сайта
function getCurrentHelpers() {
    const hostname = window.location.hostname.replace('www.', '');
    return window.pluginManager.getHelpers(hostname);
}

// Функция дебаунсинга
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Функция ожидания загрузки скрипта (если нужно)
async function waitForScript(scriptName, config) {
    if (!scriptName) return;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
        if (window[scriptName]) return;
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
    }
}

// Основная функция добавления рублёвых цен
async function addRubPrice(exchangeRate) {
    const config = getCurrentSiteConfig();
    if (!config) return;

    try {
        DOMHandler.clearOldPrices();
        
        await Promise.all([
            waitForScript(config.scriptToWait, config),
            new Promise(resolve => setTimeout(resolve, config.delay || 1000))
        ]);

        const debouncedUpdate = debounce(async () => {
            try {
                const priceElement = DOMHandler.findPriceElement(config);
                if (priceElement) {
                    DOMHandler.addConvertedPrice(priceElement, exchangeRate);
                }
            } catch (err) {}
        }, 500);

        const container = document.querySelector(config.containerSelector) || document.body;
        const observer = new MutationObserver(debouncedUpdate);
        observer.observe(container, { childList: true, subtree: true });

        const setupUrlObserver = () => {
            let lastUrl = location.href;
            const urlObserver = new MutationObserver(debounce(() => {
                if (location.href !== lastUrl) {
                    lastUrl = location.href;
                    DOMHandler.clearOldPrices();
                    init();
                }
            }, 500));
            urlObserver.observe(document.body, { childList: true, subtree: true });
        };

        setupUrlObserver();
        await debouncedUpdate();

    } catch (err) {}
}

// Слушатель изменений в storage
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.exchangeRate) {
        DOMHandler.clearOldPrices();
        addRubPrice(changes.exchangeRate.newValue);
    }
});

// Слушатель сообщений от popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateExchangeRate') {
        DOMHandler.clearOldPrices();
        addRubPrice(message.rate);
        sendResponse({ success: true });
    }
    return true;
});

// Инициализация с обновленным getExchangeRate
const init = async () => {
    try {
        if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve, { once: true });
            });
        }

        const exchangeRate = await CurrencyConverter.getExchangeRate();
        await addRubPrice(exchangeRate);
    } catch (err) {}
};

// Запуск с учетом состояния DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
