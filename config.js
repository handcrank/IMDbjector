'use strict';
var Config = (function () {
	var _defaultConfig = {
		users: [],
		cacheTtl: 3,
		historyLen: 20
	};
	var _configKeys = Object.keys(_defaultConfig);
	return function () {
		function _loadDataFromConfigObject(obj) {
			for (var i in _configKeys) {
				var key = _configKeys[i];
				if (key in obj) {
					this[key] = obj[key];
				}
			}
		}
		function _configObject() {
			var obj = {};
			for (var i in _configKeys) {
				var key = _configKeys[i];
				obj[key] = this[key];
			}
			return obj;
		}
		this.load = function () {
			var config = JSON.parse(localStorage.getItem(CONFIG_NAME));
			_loadDataFromConfigObject.call(this, config || _defaultConfig);
		};
		this.save = function () {
			localStorage.setItem(CONFIG_NAME, JSON.stringify(this.data()));
		};
		this.data = function () {
			return _configObject.call(this);
		};
		this.load();
		return this;
	}
}());
