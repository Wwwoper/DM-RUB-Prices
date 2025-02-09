// plugin-manager.js
class PluginManager {
    constructor() {
        this.plugins = new Map();
    }

    register(plugin) {
        if (!this.validatePlugin(plugin)) {
            throw new Error(`Некорректный плагин: ${plugin.name}`);
        }
        this.plugins.set(plugin.name, plugin);
    }

    validatePlugin(plugin) {
        const required = ['name', 'config', 'helpers'];
        return required.every(key => key in plugin);
    }

    getPlugin(hostname) {
        // Поиск подходящего плагина
        return Array.from(this.plugins.values()).find(plugin => {
            return hostname.includes(plugin.name);
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