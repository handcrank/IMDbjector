'use strict';
// define constants (*cough*constants*cough*)
var LOCAL_STORAGE_CACHE_PREFIX = 'cache_';
var LOCAL_STORAGE_CACHE_TIME_POSTFIX = '_updated';
// set defaults
localStorage.setItem('defaultConfig', JSON.stringify({
	users: [],
	ttl: 3
}));
// helpers
function getConfig() {
	return JSON.parse(localStorage.getItem('config') || localStorage.getItem('defaultConfig'));
}
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
		response.config = getConfig();
	}
	sendResponse(response);
});
// set main connection listener
chrome.extension.onConnect.addListener(function (port) {
	if (port.name === 'getScoreData') {
		port.onMessage.addListener(function (msg) {
			if (msg.userId) {
				var config = getConfig();
				var userId = msg.userId;
				// check data age
				var lastUpdated = localStorage.getItem(LOCAL_STORAGE_CACHE_PREFIX + userId + LOCAL_STORAGE_CACHE_TIME_POSTFIX);
				if (lastUpdated !== null && parseInt(lastUpdated) + (config.ttl * 3600) > now()) {
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
function scoreDataWithRawData(rawData) {
	var csv = arrayWithCSV(rawData);
	// we're interested in 2 keys, "const" (which is the movie id) and "$username rated"
	var header = csv[0];
	var movieIdIndex, ratingIndex;
	for (var i = header.length - 1; i >= 0; i--) {
		if (header[i] === 'const') {
			movieIdIndex = i;
		} else if (/ rated$/.test(header[i])) {
			ratingIndex = i;
		}
	}
	// harvest the raw data
	var scoreData = [];
	for (var i = csv.length - 1; i >= 1; i--) {
		scoreData.push(csv[i][movieIdIndex] + ':' + csv[i][ratingIndex]);
	}
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
