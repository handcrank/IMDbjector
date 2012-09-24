(function ($) {
	$(document).on('click', 'li input.remove', function () {
		$(this).closest('li').remove();
		$('#save').removeAttr('disabled');
	});
	$(document).on('change', 'input', function () {
		$('#save').removeAttr('disabled');
	});
	$(function () {
		var users = $('#users');
		var ttl   = $('#ttl');
		function addUser(nameVal, idVal) {
			var userName = $('<input/>', {type: 'text', name: 'userNames[]', value: nameVal, placeholder: 'user name'});
			var userId   = $('<input/>', {type: 'text', name: 'userIds[]', value: idVal, placeholder: 'user id (e.g. ur12345678)'});
			$('<li/>')
				.append(userName)
				.append(userId)
				.append($('<input/>', {type: 'button', value: 'remove', 'class': 'remove'}))
				.appendTo(users);
		}
		function restoreConfig() {
			// load config
			var config = localStorage.getItem('config') || localStorage.getItem('defaultConfig');
			config = JSON.parse(config);
			// insert config data into page
			for (var i in config.users) {
				addUser(config.users[i].name, config.users[i].id);
			}
			ttl.val(config.ttl);
		}
		function saveConfig() {
			var config = JSON.parse(localStorage.getItem('defaultConfig'));
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
			config.ttl = Math.max(parseInt(ttl.val()), 1) || config.ttl;
			// store config
			localStorage.setItem('config', JSON.stringify(config));
		}
		$('#addUser').click(function () {
			addUser('', '');
		});
		$('#save').click(function () {
			$(this).attr('disabled', 'disabled');
			saveConfig();
		});
		restoreConfig();
	});
}(jQuery));
