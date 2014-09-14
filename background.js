'use strict';
// helper functions
var _config = new Config;
function now() {
	return parseInt(new Date().getTime() / 1000);
}
// set our main message listener
chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
	var response = {};
	if (request.showIcon) {
		chrome.pageAction.show(sender.tab.id);
	}
	if (request.sendConfig) {
		response.config = _config.data();
	}
	sendResponse(response);
});
// set main connection listener
chrome.extension.onConnect.addListener(function (port) {
	if (port.name === 'getScoreData') {
		port.onMessage.addListener(function (msg) {
			if (msg.userId) {
				var userId = msg.userId;
				// check data age
				var lastUpdated = localStorage.getItem(LOCAL_STORAGE_CACHE_PREFIX + userId + LOCAL_STORAGE_CACHE_TIME_POSTFIX);
				if (lastUpdated !== null && parseInt(lastUpdated) + (_config.cacheTtl * 3600) > now()) {
					port.postMessage({scoreData: dataForUser(userId)});
					port.disconnect();
				} else {
					refreshDataForUser(userId, function (scoreData) {
						port.postMessage({scoreData: scoreData});
						port.disconnect();
					});
				}
			}
		});
	}
});
// data storage management
function arrayWithCSV(csv) {
	// tried to use http://code.google.com/p/jquery-csv/ but it's total crap. skips empty columns, doesn't skip empty last line, useless.
	// this is arguably a pretty bad general csv parser, but it works for IMDb's export (for now), it can be easily replaced later on with a proper parser and I don't want to waste any more time with this shit right now.
	var array = [];
	var lines = csv.split(/\r\n|\r|\n/g);
	for (var i = 0, e = lines.length; i < e; ++i) {
		var line   = lines[i];
		var values = [];
		var parser = /\"(.*?)\"/g;
		for (var val; val = parser.exec(line); ) {
			values.push(val[1]);
		}
		if (values.length) {
			array.push(values);
		}
	}
	return array;
}
/*
	scoreDataWithRawData(rawData)
		parses csv rawData for movie ids and scores
		(side effect:) also updates the internal movie title / history database
*/
function scoreDataWithRawData(rawData) {
	var csv = arrayWithCSV(rawData);
	// we're interested in 4 keys, "const" (which is the movie id), the "Title", "created" (which is the rating date) and "$username rated" (the rating itself)
	var header = csv[0];
	var movieIdIndex, movieTitleIndex, ratingIndex, ratingDateIndex;
	for (var i = header.length - 1; i >= 0; i--) {
		if (header[i] === 'const') {
			movieIdIndex = i;
		} else if (header[i] === 'Title') {
			movieTitleIndex = i;
		} else if (header[i] === 'created') {
			ratingDateIndex = i;
		} else if (/ rated$/.test(header[i])) {
			ratingIndex = i;
		}
	}
	// harvest the raw data
	var scoreData = [];
	var historyDb = JSON.parse(localStorage.getItem(HISTORY_DB_NAME)) || {updated: 0, data: {}};
	var historyData = historyDb.data;
	for (var i = csv.length - 1; i >= 1; i--) {
		var movieId = csv[i][movieIdIndex];
		scoreData.push(movieId + ':' + csv[i][ratingIndex]);
		// update history db
		var oldT = historyData[movieId] ? historyData[movieId][1] : 0;
		var newT = parseInt((new Date(csv[i][ratingDateIndex])).getTime() / 1000);
		historyData[movieId] = [csv[i][movieTitleIndex], Math.max(oldT, newT)];
	}
	historyDb.updated = now();
	localStorage.setItem(HISTORY_DB_NAME, JSON.stringify(historyDb));
	return scoreData.join('\n');
}
function setDataForUser(data, userId) {
	var userStorageKey = LOCAL_STORAGE_CACHE_PREFIX + userId;
	localStorage.setItem(userStorageKey, data);
	localStorage.setItem(userStorageKey + LOCAL_STORAGE_CACHE_TIME_POSTFIX, now());
}
function dataForUser(userId) {
	var userStorageKey = LOCAL_STORAGE_CACHE_PREFIX + userId;
	return localStorage.getItem(userStorageKey);
}
function refreshDataForUser(userId, callback) {
	var url = 'http://www.imdb.com/list/export?list_id=ratings&author_id=' + userId;
	var req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.onload = function () {
		if (req.status === 200) {
			setDataForUser(scoreDataWithRawData(req.responseText), userId);
		}
		callback(dataForUser(userId), userId);
	};
	req.send(null);
}
