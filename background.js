chrome.app.runtime.onLaunched.addListener(function(launchData) {
  chrome.app.window.create(
    'index.html',
    {
      id: 'mainWindow',
      bounds: {width: 400, height: 568},
      minWidth: 400,
      minHeight: 568,
      maxWidth: 400,
      maxHeight: 568
    }
  );
});
