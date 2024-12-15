// Сохранение настроек
document.getElementById('save').addEventListener('click', () => {
  const rate = document.getElementById('rate').value;
  chrome.storage.sync.set({
      exchangeRate: parseFloat(rate)
  }, () => {
      // Показываем уведомление о сохранении
      const status = document.createElement('div');
      status.textContent = 'Settings saved!';
      status.style.color = 'green';
      document.body.appendChild(status);
      
      // Получаем текущую активную вкладку
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs[0] && tabs[0].url.includes('dm.de')) {
              // Перезагружаем вкладку
              chrome.tabs.reload(tabs[0].id);
          }
      });
      
      setTimeout(() => status.remove(), 2000);
  });
});

// Загрузка сохраненных настроек
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
      exchangeRate: 95 // значение по умолчанию
  }, (items) => {
      document.getElementById('rate').value = items.exchangeRate;
  });
});