(function ($) {
	'use strict';
	// general/basic js extensions
	function average(anArray) {
		if (!anArray.length) {
			return 0;
		}
		var sum = 0;
		for (var i = anArray.length - 1; i >= 0; i--) {
			sum += anArray[i];
		}
		return sum / anArray.length;
	}
	function values(anObject) {
		var values = [];
		for (var key in anObject) {
			if (anObject.hasOwnProperty(key)) {
				values.push(anObject[key]);
			}
		}
		return values;
	}
	// html helpers/generators
	function friendScoreDetails(scores, className) {
		// create box element
		var box = $('<div/>', {'class': 'friendScoreDetails'});
		if (className) {
			box.addClass(className);
		}
		// create list element
		var list = $('<ul/>').appendTo(box);
		// create a list of user ids sorted by user names (this seems a bit bloated, could probably be done more elegantly)
		var userName2userId = {};
		for (var userId in scores) {
			if (scores.hasOwnProperty(userId)) {
				userName2userId[userNameForId(userId)] = userId;
			}
		}
		var sortedUserNames = Object.keys(userName2userId).sort();
		var sortedUserIds = [];
		for (var i = 0, e = sortedUserNames.length; i < e; ++i) {
			var userName = sortedUserNames[i];
			sortedUserIds.push(userName2userId[userName]);
		}
		// create list item elements
		for (var i = 0, e = sortedUserIds.length; i < e; ++i) {
			var userId = sortedUserIds[i];
			var rating = scores[userId];
			var userName = userNameForId(userId);
			$('<li/>')
				.append($('<a/>', {href: 'http://www.imdb.com/user/' + userId + '/ratings'}).text(userName))
				.append(': ')
				.append($('<span/>').text(rating).css('float', 'right'))
				.appendTo(list);
		}
		// create anchor element
		var anchor = $('<a/>', {href: '#showFriends'})
			.text(Object.keys(scores).length)
			.click(function (event) {
				event.preventDefault();
			});
		// create a container to neatly bundle everything and make positioning the box easier
		var container = $('<span/>')
			.append(box)
			.append(anchor)
			.hover(function () {
				box.show();
			}, function () {
				box.hide();
			});
		// aaand we're done, and it only hurt a little :)
		return container;
	}
	function updateScoreHtml(scores, context) {
		var avgScore = average(values(scores));
		var container = $('.star-box-details');
		if (container.length) {
			// new style
			$('.friend-score', container).remove();
			container = $('<span/>', {'class': 'friend-score'}).appendTo(container);
			if (!context.done) {
				container.css('font-style', 'italic');
			}
			var score = $('<strong/>').text('N/A');
			var html = ['<br/>', 'Friends: ', score];
			if (avgScore > 0) {
				score.text(avgScore.toFixed(1));
				html.push($('<span/>', {'class': 'mellow'}).text('/10'));
				html.push(' (from ');
				html.push(friendScoreDetails(scores, 'new'));
				html.push(' of ' + getUserIds().length + ' friends)');
			}
			container.append(html);
		} else {
			// old style
			container = $('#tn15rating');
			var starBarHtml = '';
			var score = 'N/A';
			if (avgScore > 0) {
				score = avgScore.toFixed(1) + '/10';
				var starBarMaxWidth = 200;
				var starBarWidth = parseInt(starBarMaxWidth * avgScore / 10);
				starBarHtml = '<div class="starbar"><div class="outer"><div id="general-voting-stars" class="inner" style="width: ' + starBarWidth + 'px"></div></div></div>';
			}
			var html = '<div class="friends"><div class="info stars"><h5>Your Friends:</h5>' + starBarHtml + '<div class="starbar-meta"><b>' + score + '</b>&nbsp;&nbsp;</div></div></div>';
			html = $(html);
			if (avgScore > 0) {
				$('.starbar-meta', html)
					.append(friendScoreDetails(scores, 'old'))
					.append(' of ' + getUserIds().length + ' friends');
			}
			container.append(html);
		}
	}
	// access storage data
	function callWithScore(callback, context) {
		var port = chrome.extension.connect({name: "getScoreData"});
		port.onDisconnect.addListener(function () {
			if (context.preliminary === true) {
				console.warn('Only preliminary data received for user: ' + context.userId);
			} else if (context.preliminary !== false) {
				console.warn('No data received for user: ' + context.userId);
			}
			context.done = true;
			callback(null, context);
		});
		port.onMessage.addListener(function (msg) {
			context.preliminary = msg.preliminary;
			var scoreData = msg.scoreData;
			// search for the score
			var scoreRe = new RegExp(context.movieId + ':(\\d+)');
			var score   = scoreRe.exec(scoreData ? scoreData : '');
			// and report back
			callback(score !== null ? parseInt(score[1]) : null, context);
		});
		port.postMessage({userId: context.userId});
	}
	/*
	callWithScores(callback, userIds, movieId)
		callback will be called with
			scores (a dict/object, containing userId:rating)
	*/
	function callWithScores(callback, userIds, movieId) {
		var scores = {};
		var userCount = userIds.length;
		if (!userCount) return callback(scores, {done: true});
		// load scores
		for (var i = userCount; i > 0; --i) {
			callWithScore(function (score, context) {
				if (score !== null) {
					scores[context.userId] = score;
				}
				if (context.done) {
					--userCount
				}
				callback(scores, {done: userCount === 0});
			}, {
				userId: userIds[i - 1],
				movieId: movieId
			});
		}
	}
	// config/parameters
	var _config = {};
	function getUserIds() {
		var userIds = [];
		for (var i in _config.users) {
			var user = _config.users[i];
			userIds.push(user.id);
		}
		return userIds;
	}
	function userNameForId(userId) {
		for (var i in _config.users) {
			var user = _config.users[i];
			if (user.id === userId) {
				return user.name;
			}
		}
	}
	function getMovieId() {
		var movieId = /\/(tt[0-9]+)\//.exec(location.pathname);
		return movieId !== null ? movieId[1] : null;
	}
	// eeh.. enough with the helper functions already, do something!
	// let's show our icon, read the config, and get this party started
	chrome.extension.sendMessage({showIcon: true, sendConfig: true}, function (response) {
		_config = response.config;
		// injecting html
		callWithScores(updateScoreHtml, getUserIds(), getMovieId());
	});
}(jQuery));
