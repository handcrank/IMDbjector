'use strict';
$(document).on('click', 'li input.remove', function () {
	$(this).closest('li').remove();
	$('#save').removeAttr('disabled');
});
$(document).on('change', 'input, textarea', function () {
	$('#save').removeAttr('disabled');
});
$(function () {
	var config = new Config;
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
	var usersList = $('#usersList');
	var usersTextarea = $('#usersJson');
	var addUserButton = $('#addUser');
	var ttl = $('#ttl');
	var histLen = $('#historyLen');
	function addUser(nameVal, idVal) {
		var userName = $('<input/>', {type: 'text', 'class': 'user-name', name: 'userNames[]', value: nameVal, placeholder: 'user name'});
		var userId   = $('<input/>', {type: 'text', 'class': 'user-id',   name: 'userIds[]',   value: idVal,   placeholder: 'user id (e.g. ur12345678)'});
		$('<li/>', {'class': 'user'})
			.append(userName)
			.append(userId)
			.append($('<input/>', {type: 'button', value: 'remove', 'class': 'remove'}))
			.appendTo(usersList);
	}
	function restoreFromConfig() {
		usersList.children().remove();
		// insert config data into page
		for (var i in config.users) {
			addUser(config.users[i].name, config.users[i].id);
		}
		ttl.val(config.cacheTtl);
		histLen.val(config.historyLen);
	}
	function saveConfig() {
		// read data from page
		var users = [];
		var userNames = $('input[name="userNames[]"]');
		var userIds   = $('input[name="userIds[]"]');
		for (var i = 0, e = userIds.length; i < e; ++i) {
			var userName = userNames.eq(i).val();
			var userId   = userIds.eq(i).val();
			if (userName.length && /ur\d+/.test(userId)) {
				users.push({name: userName, id: userId});
			} else {
				userIds.eq(i).closest('li').remove();
			}
		};
		config.users = users;
		config.cacheTtl = Math.max(1, parseInt(ttl.val())) || config.cacheTtl;
		var historyLen  = parseInt(histLen.val()); // has to be done in 2 steps because 0 is a valid value
		if (historyLen >= 0) {
			config.historyLen = historyLen;
		}
		// store config
		config.save();
	}
	addUserButton.click(function () {
		addUser('', '');
	});
	$('#editUsers').click(function () {
		var didEditJSON = addUserButton.is(':hidden');
		$(this).text(didEditJSON ? 'edit as JSON' : 'edit as list');
		addUserButton.toggle();
		usersList.toggle();
		usersTextarea.toggle();
		if (didEditJSON) {
			var newUserConfig = JSON.parse(usersTextarea.val());
			if (newUserConfig) {
				config.users = newUserConfig;
				restoreFromConfig();
			}
		} else {
			usersTextarea.val(JSON.stringify(config.users, null, 2));
		}
	});
	// save
	$('#save').click(function () {
		$(this).attr('disabled', 'disabled');
		saveConfig();
	});
	restoreFromConfig();
});
