# Development

### How to install the latest version
- Install the latest version of Google Chorme
- Drag and drop this file into you browser with the URL of chorme://extensions
- https://github.com/broadsoftxtended/Product-ChromePhone/blob/master/dist/ChromePhone-V-1.crx

### How to run this app (Development)

```
git clone https://github.com/broadsoftxtended/Product-Phone-for-Chrome.git Phone-For-Chorme
cd Phone-For-Chorme
grunt (creates the minified and watches the app for new changes)
```

- open up the latest chrome browser
- go to: chrome://extensions
- enable the developer mode checkbox
- click load unpackaged extension
- Navigate to your downloaded code
- when you see the extension, click launch

### Developing this app

```
grunt
```

### Testing

```
npm test
```

### Note on development

- You can also update the main.js file to point to an entry point if you are testing that one page. (Note: you need to login to have your credentials stored in the $http module)
- New .less files have to be added to '/app/styles/importer.less
- New types of files needed for the app need to be added to pipeline.js

### Google apis

- This is set up with a client ID in my personal gmail account. I may need more privleges added in my broadsoft gmail account.
- This is how you create one: http://puu.sh/hU7Bc/dcd481006b.png
