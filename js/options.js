document.addEventListener('DOMContentLoaded', () => {
    const exchangeRateInput = document.getElementById('exchangeRate');
    const saveButton = document.getElementById('save');
    const resetButton = document.getElementById('reset');
    const status = document.getElementById('status');
    
    // Устанавливаем версию
    document.querySelector('.footer').textContent = 
        `Версия ${chrome.runtime.getManifest().version} • Автоматическая конвертация цен`;

    // Загружаем настройки
    chrome.storage.sync.get({ exchangeRate: 95 }, items => 
        exchangeRateInput.value = items.exchangeRate);

    // Показ статуса
    const showStatus = (message, type) => {
        status.textContent = message;
        status.className = `status ${type}`;
        setTimeout(() => status.className = 'status', 2000);
    };

    // Сохраняем настройки
    const saveOptions = () => {
        const newRate = parseFloat(exchangeRateInput.value);
        
        if (isNaN(newRate) || newRate <= 0) {
            return showStatus('Введите корректное значение курса!', 'error');
        }

        chrome.storage.sync.set({ exchangeRate: newRate }, () => {
            showStatus('Настройки сохранены!', 'success');
            
            // Обновляем цены на всех открытых вкладках
            chrome.tabs.query({}, tabs => {
                const sites = ['dm.de', 'zara.com', 'ikea.com', 'cocooncenter.de', 'parfumsclub.de', 'parfumdreams.de'];
                tabs.forEach(tab => {
                    if (sites.some(site => tab.url.includes(site))) {
                        chrome.tabs.sendMessage(tab.id, { type: 'updateExchangeRate', rate: newRate }, 
                            () => chrome.tabs.reload(tab.id));
                    }
                });
            });
        });
    };

    // Сброс настроек
    const resetOptions = () => {
        exchangeRateInput.value = 95;
        chrome.storage.sync.set({ exchangeRate: 95 }, () => {
            showStatus('Настройки сброшены!', 'success');
            chrome.tabs.query({}, tabs => {
                const sites = ['dm.de', 'zara.com', 'ikea.com'];
                tabs.forEach(tab => {
                    if (sites.some(site => tab.url.includes(site))) {
                        chrome.tabs.reload(tab.id);
                    }
                });
            });
        });
    };

    // Обработчики событий
    saveButton.addEventListener('click', saveOptions);
    resetButton.addEventListener('click', resetOptions);
    exchangeRateInput.addEventListener('keypress', e => e.key === 'Enter' && saveOptions());
});