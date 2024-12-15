// Загружаем текущий курс при открытии popup
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.sync.get({
        exchangeRate: 95 // значение по умолчанию
    }, (items) => {
        document.getElementById('quickRate').value = items.exchangeRate;
    });
});

// Обработчик кнопки сохранения
document.getElementById('quickSave').addEventListener('click', () => {
    const rate = document.getElementById('quickRate').value;
    
    chrome.storage.sync.set({
        exchangeRate: parseFloat(rate)
    }, () => {
        // Получаем текущую активную вкладку
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].url.includes('dm.de')) {
                // Перезагружаем вкладку
                chrome.tabs.reload(tabs[0].id);
                // Закрываем popup
                window.close();
            }
        });
    });
});

// Добавляем обработку Enter в поле ввода
document.getElementById('quickRate').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        document.getElementById('quickSave').click();
    }
}); 