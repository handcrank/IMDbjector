'use strict';
$(document).on('click', 'li input.remove', function () {
	$(this).closest('li').remove();
	$('#save').removeAttr('disabled');
});
$(document).on('change', 'input', function () {
	$('#save').removeAttr('disabled');
});
$(function () {
	// cache
	$('#purgeCache').click(function () {
		for (var key in localStorage) {
			if (key.indexOf(LOCAL_STORAGE_CACHE_PREFIX) === 0) {
				localStorage.removeItem(key);
			}
		}
		localStorage.removeItem(HISTORY_DB_NAME);
	});
	// friends
	var users   = $('#users');
	var ttl     = $('#ttl');
	var histLen = $('#historyLen');
	function addUser(nameVal, idVal) {
		var userName = $('<input/>', {type: 'text', 'class': 'user-name', name: 'userNames[]', value: nameVal, placeholder: 'user name'});
		var userId   = $('<input/>', {type: 'text', 'class': 'user-id',   name: 'userIds[]',   value: idVal,   placeholder: 'user id (e.g. ur12345678)'});
		$('<li/>')
			.append(userName)
			.append(userId)
			.append($('<input/>', {type: 'button', value: 'remove', 'class': 'remove'}))
			.appendTo(users);
	}
	function restoreConfig() {
		// load config
		var config = localStorage.getItem(CONFIG_NAME) || localStorage.getItem(DEFAULT_CONFIG_NAME);
		config = JSON.parse(config);
		// insert config data into page
		for (var i in config.users) {
			addUser(config.users[i].name, config.users[i].id);
		}
		ttl.val(config.cacheTtl);
		histLen.val(config.historyLen);
	}
	function saveConfig() {
		var config = JSON.parse(localStorage.getItem(DEFAULT_CONFIG_NAME));
		// read data from page
		var userNames = $('input[name="userNames[]"]');
		var userIds   = $('input[name="userIds[]"]');
		for (var i = 0, e = userIds.length; i < e; ++i) {
			var userName = userNames.eq(i).val();
			var userId   = userIds.eq(i).val();
			if (userName.length && /ur\d+/.test(userId)) {
				config.users.push({name: userName, id: userId});
			} else {
				userIds.eq(i).closest('li').remove();
			}
		};
		config.cacheTtl = Math.max(1, parseInt(ttl.val())) || config.cacheTtl;
		var historyLen  = parseInt(histLen.val()); // has to be done in 2 steps because 0 is a valid value
		if (historyLen >= 0) {
			config.historyLen = historyLen;
		}
		// store config
		localStorage.setItem(CONFIG_NAME, JSON.stringify(config));
	}
	$('#addUser').click(function () {
		addUser('', '');
	});
	// save
	$('#save').click(function () {
		$(this).attr('disabled', 'disabled');
		saveConfig();
	});
	restoreConfig();
});
