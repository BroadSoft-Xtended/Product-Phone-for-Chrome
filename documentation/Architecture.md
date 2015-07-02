# Appplication Architecture

[Full list of dependencies](https://github.com/broadsoftxtended/Product-Phone-for-Chrome/blob/master/documentation/Dependencies.md)

## Overview

This application is built on chrome and can be run as a chrome application anywhere that chrome can be installed. It can also be hosted on any mobile device in the future though this is not yet supported.

[What are Chrome Apps?](https://developer.chrome.com/apps/about_apps)

The app uses HTML, CSS and Javascript to display the content you see in the app. It does this through a technology called AngularJS

[What is Angular JS?](https://angularjs.org/)

The application also uses Angular-ui-router to manage app states and routing.

[What is UI-Router?](https://github.com/angular-ui/ui-router/blob/master/README.md)

## Building 

This app is built using grunt. A Javascript task runner. It builds the app and minifies it.

[What is Grunt?](http://gruntjs.com/)

## Testing

Node.js, karma and Mocha are used to test the application. These back-end services are only needed to test and build. They are not needed to run the application.

## Packaging

The chrome browser handles the app packaging
