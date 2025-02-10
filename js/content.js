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
        element.textContent = `${Math.ceil(price).toLocaleString('ru-RU')} ₽`;
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

// Добавим защиту от множественных обновлений
let isProcessing = false;
let processTimeout = null;

async function initPriceProcessing(config) {
    // Если уже идет обработка, отменяем
    if (isProcessing) {
        clearTimeout(processTimeout);
        return;
    }
    
    isProcessing = true;
    console.log('🔍 [RUB Prices]: Current config:', config);

    try {
        // Очищаем старые цены
        const oldPrices = document.querySelectorAll('.rub-price');
        oldPrices.forEach(el => el.remove());
        
        // Сбрасываем атрибуты
        document.querySelectorAll('[data-rub-price-processed]').forEach(el => {
            el.removeAttribute('data-rub-price-processed');
            el.removeAttribute('data-rub-price');
        });

        // Ждем загрузку и задержку
        if (config.scriptToWait) {
            await waitForScript(config.scriptToWait);
        }
        await new Promise(resolve => setTimeout(resolve, config.delay || 1000));

        // Находим и обрабатываем цены
        const priceElements = document.querySelectorAll(config.priceSelector);
        console.log('🔍 [RUB Prices]: Found price elements:', priceElements.length);

        for (const element of priceElements) {
            if (!element.hasAttribute('data-rub-price-processed')) {
                await processPrice(element, config);
            }
        }
    } finally {
        // Сбрасываем флаг обработки через небольшую задержку
        processTimeout = setTimeout(() => {
            isProcessing = false;
        }, 500);
    }
}

// Функция для обработки отдельной цены
async function processPrice(element, config) {
    try {
        log('Starting price processing for element:', element);
        
        const priceText = element.textContent.trim();
        log('Price text found:', priceText);
        
        const match = priceText.match(/(\d+[,.]\d+)/);
        if (!match) {
            warn('No price match found in text:', priceText);
            return false;
        }

        const price = parseFloat(match[1].replace(',', '.'));
        if (isNaN(price)) {
            warn('Invalid price number:', match[1]);
            return false;
        }
        log('Parsed price:', price);

        // Получаем хелперы для текущего сайта
        const hostname = window.location.hostname.replace('www.', '');
        const helpers = window.pluginManager.getHelpers(hostname);
        
        log('Helpers found:', !!helpers);
        
        if (helpers && helpers.displayRubPrice) {
            // Получаем курс обмена
            const exchangeRate = await CurrencyConverter.getExchangeRate();
            log('Exchange rate:', exchangeRate);
            
            const rubPrice = price * exchangeRate;
            log('Calculated RUB price:', rubPrice);
            
            const container = config.containerSelector ? 
                element.closest(config.containerSelector) : 
                element.parentElement;
            
            log('Found container:', !!container);
            
            if (container) {
                // Используем новый хелпер для отображения цены
                helpers.displayRubPrice(container, price, rubPrice);
                
                element.setAttribute('data-rub-price-processed', 'true');
                log('Price processing completed successfully');
                return true;
            }
        } else {
            warn('No helpers found for', hostname);
        }
        
        return false;
    } catch (error) {
        error('Error processing price:', error);
        return false;
    }
}

// Функция для ожидания загрузки скрипта
function waitForScript(scriptUrl) {
    return new Promise(resolve => {
        if (document.querySelector(`script[src*="${scriptUrl}"]`)) {
            resolve();
        } else {
            const observer = new MutationObserver((mutations, obs) => {
                if (document.querySelector(`script[src*="${scriptUrl}"]`)) {
                    obs.disconnect();
                    resolve();
                }
            });

            observer.observe(document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    });
}

// Функция для отслеживания изменений URL
function setupUrlChangeDetection(config) {
    let lastUrl = location.href;
    
    const observer = new MutationObserver(() => {
        if (lastUrl !== location.href) {
            console.log('🔍 [RUB Prices]: URL changed, updating prices...');
            lastUrl = location.href;
            
            if (config.updateConfig?.clearExisting) {
                const processedElements = document.querySelectorAll('[data-rub-price-processed]');
                processedElements.forEach(el => {
                    el.removeAttribute('data-rub-price-processed');
                    el.removeAttribute('data-rub-price');
                });
            }
            
            setTimeout(() => {
                initPriceProcessing(config);
            }, config.urlChangeDetection?.reloadDelay || 1000);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}

// Обновляем функцию наблюдателя
function setupPriceObserver(config) {
    let observerTimeout;
    
    const observer = new MutationObserver((mutations) => {
        // Отменяем предыдущий таймаут
        clearTimeout(observerTimeout);
        
        // Устанавливаем новый с задержкой
        observerTimeout = setTimeout(() => {
            initPriceProcessing(config);
        }, 300);
    });

    const targetNode = document.querySelector(config.observeTarget) || document.body;
    observer.observe(targetNode, config.observeConfig);
}

// Основная функция инициализации
async function init() {
    console.log('🔍 [RUB Prices]: Content script loaded');
    
    const hostname = window.location.hostname;
    const siteKey = Object.keys(window.SITE_CONFIGS).find(key => hostname.includes(key));
    
    if (siteKey) {
        const config = window.SITE_CONFIGS[siteKey];
        document.body.classList.add(siteKey.replace('.', '-'));
        
        if (config.urlChangeDetection?.enabled) {
            setupUrlChangeDetection(config);
        }
        
        await initPriceProcessing(config);
    }
}

// Запускаем инициализацию
init();
