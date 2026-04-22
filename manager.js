(function () {
    'use strict';

    var STORE_KEY = 'plugin_manager_data';
    var REMOTE_URL = 'https://moreldigo2.github.io/lampa-plugins/plugins.json';

    function log() {
        console.log('[Plugins]', ...arguments);
    }

    function getData() {
        return Lampa.Storage.get(STORE_KEY, []);
    }

    function setData(data) {
        Lampa.Storage.set(STORE_KEY, data);
    }

    function loadScript(url) {
        if (document.querySelector('script[src="' + url + '"]')) return;

        var script = document.createElement('script');
        script.src = url;
        script.async = true;

        script.onload = function () {
            log('Loaded:', url);
        };

        script.onerror = function () {
            log('Error:', url);
        };

        document.body.appendChild(script);
    }

    function loadAll() {
        var data = getData();
        var loaded = 0;

        data.forEach(function (plugin) {
            if (plugin.enabled) {
                loadScript(plugin.url);
                loaded++;
            }
        });

        Lampa.Noty.show('Загружено: ' + loaded);
    }

    function fetchRemote(callback) {
        fetch(REMOTE_URL)
            .then(function (res) {
                return res.json();
            })
            .then(function (list) {
                setData(list);
                Lampa.Noty.show('Список обновлён');
                callback();
            })
            .catch(function () {
                Lampa.Noty.show('Ошибка загрузки списка');
                callback();
            });
    }

    function toggle(index) {
        var data = getData();
        data[index].enabled = !data[index].enabled;
        setData(data);
    }

    function rebuild() {
        Lampa.SettingsApi.addComponent({
            component: 'plugin_manager',
            name: 'Мои плагины',
            icon: 'plugin'
        });

        Lampa.SettingsApi.addParam({
            component: 'plugin_manager',
            param: {
                name: 'update',
                type: 'button',
                title: '🔄 Обновить список',
                onChange: function () {
                    fetchRemote(rebuild);
                }
            }
        });

        Lampa.SettingsApi.addParam({
            component: 'plugin_manager',
            param: {
                name: 'load',
                type: 'button',
                title: '🚀 Загрузить плагины',
                onChange: function () {
                    loadAll();
                }
            }
        });

        var data = getData();

        data.forEach(function (plugin, index) {
            Lampa.SettingsApi.addParam({
                component: 'plugin_manager',
                param: {
                    name: 'plugin_' + index,
                    type: 'toggle',
                    title: plugin.name,
                    subtitle: plugin.url,
                    value: plugin.enabled,
                    onChange: function () {
                        toggle(index);
                    }
                }
            });
        });
    }

    function start() {
        fetchRemote(function () {
            loadAll();
            rebuild();
        });
    }

    if (window.Lampa) start();
    else document.addEventListener('lampa', start);
})();
