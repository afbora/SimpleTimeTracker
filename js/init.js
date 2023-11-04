$(async function () {
    await taskInterface.init();

    // show current version
    $.getJSON(chrome.runtime.getURL('/manifest.json'), function (manifest) {
        $('#version').text(manifest.version);
    });
});
