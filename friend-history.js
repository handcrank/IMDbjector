'use strict';
// helpers (should probably be put in global.js and consolidated with others)
function now() {
	return parseInt(new Date().getTime() / 1000);
}
var _config = new Config;
function getUserIds() {
	var userIds = [];
	for (var i in _config.users) {
		var user = _config.users[i];
		userIds.push(user.id);
	}
	return userIds;
}
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
//
function prettyTimeFromSeconds(seconds) {
	var days = Math.abs(parseInt(seconds / 86400)); // iMDB resolution is only full days
	// special cases
	if (days === 0) {
		return 'today';
	} else if (days === 1) {
		return 'yesterday';
	}
	// prettify
	var quants = [365, 30, 7, 1];
	var names  = ['year', 'month', 'week', 'day'];
	for (var i in quants) {
		if (days > quants[i]) {
			break;
		}
	}
	var amount = parseInt(days / quants[i]);
	var name   = amount === 1 ? names[i] : names[i] + 's';
	return amount + ' ' + name;
}
//
$(function () {
	var history = $('#friend-history');
	// load history database
	var historyDb = JSON.parse(localStorage.getItem(HISTORY_DB_NAME)) || {updated: 0, data: {}};
	var historyData = historyDb.data;
	// load rating history list cache
	// historyList is not strictly necessary, it is just so we don't have to sort the movies and calculate their rating over and over again – a cache's cache, if you will
	var HISTORY_CACHE_NAME = HISTORY_DB_NAME + '_cache';
	var historyList = JSON.parse(localStorage.getItem(HISTORY_CACHE_NAME)) || {updated: 0, data: []};
	var historyListData = historyList.data;
	if (historyList.updated < historyDb.updated) {
		historyList.updated = historyDb.updated; //now(); // by setting it to historyDb.updated instead of now() we are able to properly inform the user about the data's age
		// create a list of all rated movies, sorted by rating time
		var ratedOrder = [];
		for (var movieId in historyData) {
			if (historyData.hasOwnProperty(movieId)) {
				var lastRated  = historyData[movieId][1];
				ratedOrder.push([lastRated, movieId]);
			}
		}
		ratedOrder.sort(function (a, b) {
			return b[0] - a[0];
		});
		// build the rating history list cache
		historyListData = [];
		for (var i in ratedOrder) {
			var movieId = ratedOrder[i][1];
			// calculate the average score
			var scoreRe = new RegExp(movieId + ':(\\d+)');
			var userIds = getUserIds();
			var scores  = [];
			for (var i in userIds) {
				var userId = userIds[i];
				// load user score data
				var userStorageKey = LOCAL_STORAGE_CACHE_PREFIX + userId;
				var scoreData = localStorage.getItem(userStorageKey);
				// search for the score
				var score = scoreRe.exec(scoreData ? scoreData : '');
				if (score !== null) {
					scores.push(parseInt(score[1]));
				}
			}
			var avgScore = average(scores);
			//
			historyListData.push([movieId, avgScore, scores.length]);
		}
		historyList.data = historyListData;
		// store rating history list cache
		localStorage.setItem(HISTORY_CACHE_NAME, JSON.stringify(historyList));
	}
	// display the history data as pretty html
	var nowT = now();
	for (var i in historyListData) {
		if (_config.historyLen && i >= _config.historyLen) {
			break;
		}
		var movieId     = historyListData[i][0];
		var avgScore    = historyListData[i][1];
		var ratingCount = historyListData[i][2];
		var movieTitle = historyData[movieId][0];
		var lastRated  = historyData[movieId][1];
		//
		$('<li/>')
			.append( $('<a/>', {'class': 'title', href: 'http://www.imdb.com/title/' + movieId + '/', target: '_blank'}).text(movieTitle) )
			.append( $('<span/>', {'class': 'score'}).html('<strong>' + avgScore.toFixed(1) + '</strong>/10') )
			.append( $('<span/>', {'class': 'rating-details'}).text('(' + ratingCount + ' vote' + (ratingCount>1?'s':'') + ')') )
			.append( $('<span/>', {'class': 'age'}).text(prettyTimeFromSeconds(nowT - lastRated)) )
			.appendTo(history);
	}
});
