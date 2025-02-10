// plugin-manager.js
class PluginManager {
    constructor() {
        this.plugins = new Map();
    }

    register(plugin) {
        if (!this.validatePlugin(plugin)) {
            throw new Error(`Некорректный плагин: ${plugin.name}`);
        }
        plugin.helpers = {
            ...this.getDefaultHelpers(),
            ...(plugin.helpers || {})
        };
        this.plugins.set(plugin.name, plugin);
    }

    validatePlugin(plugin) {
        const required = ['name', 'config', 'helpers'];
        return required.every(key => key in plugin);
    }

    getDefaultHelpers() {
        return {
            displayRubPrice: (container, euroPrice, rubPrice) => {
                // Создаем обертку для цены
                const priceWrapper = document.createElement('div');
                priceWrapper.className = 'rub-price-wrapper';
                priceWrapper.setAttribute('data-rub-price-container', 'true');
                
                // Создаем элемент с ценой в рублях
                const rubPriceElement = document.createElement('div');
                rubPriceElement.className = 'rub-price-value';
                rubPriceElement.setAttribute('data-rub-price-value', 'true');
                rubPriceElement.style.cssText = `
                    margin-top: 5px;
                    color: #666;
                    font-size: 0.9em;
                    font-weight: 500;
                    display: block;
                    padding: 2px 0;
                `;
                
                // Округляем цену до целого числа и форматируем с разделителями
                const roundedPrice = Math.round(rubPrice);
                rubPriceElement.textContent = `≈ ${roundedPrice.toLocaleString('ru-RU')} ₽`;
                
                // Удаляем существующий элемент с ценой в рублях, если есть
                const existingWrapper = container.querySelector('[data-rub-price-container]');
                if (existingWrapper) {
                    existingWrapper.remove();
                }
                
                // Добавляем новый элемент
                priceWrapper.appendChild(rubPriceElement);
                
                // Находим наилучшее место для вставки
                const priceElement = container.querySelector('[data-dmid="price-localized"]');
                if (priceElement) {
                    const parentElement = priceElement.parentNode;
                    parentElement.insertBefore(priceWrapper, priceElement.nextSibling);
                } else {
                    container.appendChild(priceWrapper);
                }
                
                // Добавляем проверку видимости и логирование
                setTimeout(() => {
                    const addedElement = container.querySelector('[data-rub-price-value]');
                    if (!addedElement || !addedElement.offsetParent) {
                        console.warn('🔍 [RUB Prices]: Price element might be hidden or not added');
                        console.log('Container:', container);
                        console.log('Added element:', addedElement);
                    } else {
                        console.log('🔍 [RUB Prices]: Price element successfully added and visible');
                    }
                }, 100);
            }
        };
    }

    getPlugin(hostname) {
        return Array.from(this.plugins.values()).find(plugin => {
            const pluginDomain = plugin.name.toLowerCase();
            const currentDomain = hostname.toLowerCase();
            return currentDomain.includes(pluginDomain);
        });
    }

    getConfig(hostname) {
        const plugin = this.getPlugin(hostname);
        return plugin ? plugin.config : null;
    }

    getHelpers(hostname) {
        const plugin = this.getPlugin(hostname);
        return plugin ? plugin.helpers : null;
    }
}

window.pluginManager = new PluginManager();