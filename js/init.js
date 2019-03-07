$(function () {
	taskInterface.init();

	// show current version
	$.getJSON(chrome.extension.getURL('/manifest.json'), function (manifest) {
		$('#version').text(manifest.version);
	});
});