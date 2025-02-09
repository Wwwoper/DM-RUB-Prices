document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup loaded');
    
    const quickRateInput = document.getElementById('quickRate');
    const quickSaveButton = document.getElementById('quickSave');
    const footer = document.querySelector('.footer span');
    const openOptionsLink = document.getElementById('openOptions');

    // Получаем версию из манифеста
    const manifest = chrome.runtime.getManifest();
    footer.textContent = `Версия ${manifest.version} • Автоматическая конвертация цен`;

    if (!quickRateInput || !quickSaveButton) {
        console.error('Elements not found!');
        return;
    }

    // Загружаем текущий курс
    chrome.storage.sync.get({ exchangeRate: 95 }, (items) => {
        console.log('Current rate:', items.exchangeRate);
        quickRateInput.value = items.exchangeRate;
    });

    quickSaveButton.addEventListener('click', () => {
        console.log('Save button clicked');
        const newRate = parseFloat(quickRateInput.value);
        
        if (isNaN(newRate) || newRate <= 0) {
            const status = document.getElementById('status');
            status.textContent = 'Введите корректное значение!';
            status.className = 'status error';
            setTimeout(() => {
                status.className = 'status';
            }, 2000);
            return;
        }

        console.log('Saving new rate:', newRate);
        
        chrome.storage.sync.set({ exchangeRate: newRate }, () => {
            console.log('Rate saved in storage');
            
            // Показываем уведомление
            const status = document.getElementById('status');
            status.textContent = 'Сохранено!';
            status.className = 'status success';
            
            setTimeout(() => {
                status.className = 'status';
            }, 2000);

            // Отправляем сообщение и перезагружаем активные вкладки
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && (tab.url.includes('dm.de') || tab.url.includes('zara.com') || tab.url.includes('ikea.com'))) {
                        console.log('Reloading tab:', tab.url);
                        // Сначала отправляем сообщение
                        chrome.tabs.sendMessage(tab.id, {
                            type: 'updateExchangeRate',
                            rate: newRate
                        }, () => {
                            // После отправки сообщения перезагружаем вкладку
                            if (chrome.runtime.lastError) {
                                console.log('Error sending message, reloading anyway');
                            }
                            chrome.tabs.reload(tab.id);
                        });
                    }
                });
            });
        });
    });

    quickRateInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            quickSaveButton.click();
        }
    });

    // Добавляем обработчик для открытия страницы настроек
    if (openOptionsLink) {
        openOptionsLink.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Options link clicked');
            chrome.runtime.openOptionsPage();
        });
    }
}); 