document.addEventListener('DOMContentLoaded', () => {
    const exchangeRateInput = document.getElementById('exchangeRate');
    const saveButton = document.getElementById('save');
    const resetButton = document.getElementById('reset');
    const status = document.getElementById('status');
    const footer = document.querySelector('.footer');

    // Устанавливаем версию
    const manifest = chrome.runtime.getManifest();
    footer.textContent = `Версия ${manifest.version} • Автоматическая конвертация цен`;

    // Загружаем текущие настройки
    function loadOptions() {
        chrome.storage.sync.get(
            { exchangeRate: 95 },
            (items) => {
                exchangeRateInput.value = items.exchangeRate;
            }
        );
    }

    // Сохраняем настройки
    function saveOptions() {
        const newRate = parseFloat(exchangeRateInput.value);
        
        if (isNaN(newRate) || newRate <= 0) {
            showStatus('Введите корректное значение курса!', 'error');
            return;
        }

        chrome.storage.sync.set(
            { exchangeRate: newRate },
            () => {
                showStatus('Настройки сохранены!', 'success');
                
                // Обновляем цены на всех открытых вкладках
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.url.includes('dm.de') || tab.url.includes('zara.com') || tab.url.includes('ikea.com')) {
                            // Сначала отправляем сообщение об обновлении
                            chrome.tabs.sendMessage(tab.id, {
                                type: 'updateExchangeRate',
                                rate: newRate
                            }, () => {
                                // После отправки сообщения перезагружаем вкладку
                                chrome.tabs.reload(tab.id);
                            });
                        }
                    });
                });
            }
        );
    }

    // Сброс настроек с перезагрузкой вкладок
    function resetOptions() {
        const defaultRate = 95;
        exchangeRateInput.value = defaultRate;
        chrome.storage.sync.set(
            { exchangeRate: defaultRate },
            () => {
                showStatus('Настройки сброшены!', 'success');
                
                // Перезагружаем вкладки после сброса
                chrome.tabs.query({}, (tabs) => {
                    tabs.forEach(tab => {
                        if (tab.url.includes('dm.de') || tab.url.includes('zara.com') || tab.url.includes('ikea.com')) {
                            chrome.tabs.reload(tab.id);
                        }
                    });
                });
            }
        );
    }

    // Показ статуса
    function showStatus(message, type) {
        status.textContent = message;
        status.className = `status ${type}`;
        setTimeout(() => {
            status.className = 'status';
        }, 2000);
    }

    // Обработчики событий
    saveButton.addEventListener('click', saveOptions);
    resetButton.addEventListener('click', resetOptions);
    exchangeRateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveOptions();
        }
    });

    // Загружаем настройки при открытии страницы
    loadOptions();
});