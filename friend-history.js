'use strict';
$(function () {
	var history = $('#friend-history');
	// load history database
	var historyDb = JSON.parse(localStorage.getItem(HISTORY_DB_NAME)) || {updated: 0, data: {}};
	var historyData = historyDb.data;
	for (var movieId in historyData) {
		if (historyData.hasOwnProperty(movieId)) {
			var movieTitle = historyData[movieId][0];
			var lastRated  = historyData[movieId][1];
			$('<li/>')
				.text(movieTitle + ': ' + lastRated)
				.appendTo(history);
		}
	}
});
