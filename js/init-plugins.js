(function() {
    // Добавим проверку на существование плагинов перед регистрацией
    const plugins = [
        window.dmPlugin,
        window.zaraPlugin,
        window.ikeaPlugin,
        window.parfumdreamsPlugin,
        window.parfumsclubPlugin,
        window.cocooncenterPlugin
    ];

    // Регистрируем только существующие плагины
    plugins.forEach(plugin => {
        if (plugin) {
            try {
                console.log('Trying to register plugin:', plugin.name);
                window.pluginManager.register(plugin);
            } catch (error) {
                console.warn('Failed to register plugin:', plugin?.name, error);
            }
        }
    });
})();