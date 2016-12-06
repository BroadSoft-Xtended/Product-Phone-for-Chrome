(function(){
  'use strict';
  ucone.factory('Utility', [function(){
    var service = {};

    service.setChromeToMinSize = function(){
      // console.log('set the window to min size');
      // console.log(chrome.app.window.current().isFullscreen());
      //
      // if(chrome.app.window.current().isFullscreen()){
      //   chrome.app.window.current().restore();
      //   chrome.app.window.current().fullscreen();
      // }
      //
      // var monitorWidth = window.screen.availWidth;
      // var monitorHeight = window.screen.availHeight;
      // var top = Math.round((monitorHeight / 2) - (568 / 2));
      // var left = Math.round((monitorWidth / 2) - (400 / 2));
      //
      // chrome.app.window.current().innerBounds.maxWidth = 400;
      // chrome.app.window.current().innerBounds.maxHeight = 568;
      // chrome.app.window.current().innerBounds.minWidth = 400;
      // chrome.app.window.current().innerBounds.minHeight = 568;
      // //chrome.app.window.current().innerBounds.top = top;
      // //chrome.app.window.current().innerBounds.left = left;
      // chrome.app.window.current().innerBounds.width = 400;
      // chrome.app.window.current().innerBounds.height = 568;
    };

    service.setChromeToVideoSize = function(){
      // console.log('set the window to video size');
      // var monitorWidth = window.screen.availWidth;
      // var monitorHeight = window.screen.availHeight;
      // var videoWidth = Math.round(monitorWidth/2);
      // var videoHeight = Math.round(videoWidth * 9 / 16);
      // var top = Math.round((monitorHeight / 2) - (videoHeight / 2));
      // var left = Math.round((monitorWidth / 2) - (videoWidth / 2));
      //
      // chrome.app.window.current().innerBounds.maxWidth = null;
      // chrome.app.window.current().innerBounds.maxHeight = null;
      // chrome.app.window.current().innerBounds.minWidth = videoWidth;
      // chrome.app.window.current().innerBounds.minHeight = videoHeight;
      // //chrome.app.window.current().innerBounds.top = top;
      // //chrome.app.window.current().innerBounds.left = left;
      // chrome.app.window.current().innerBounds.width = videoWidth;
      // chrome.app.window.current().innerBounds.height = videoHeight;
    };

    service.getFirstLetter = function (input) {
      if(input){
        return input.charAt(0);
      }
      else{
        return '?';
      }
    };

    service.getTimesForDropDown = function(){
      var times = [];

      _(96).times(function(n){
        if(n % 4 == 0){times.push(n < 40 ? '0' + Math.floor(n/4) + ':00' : Math.floor(n/4) + ':00');}
        else if(n % 4 == 1){times.push(n < 40 ? '0' + Math.floor(n/4) + ':15' : Math.floor(n/4) + ':15');}
        else if(n % 4 == 2){times.push(n < 40 ? '0' + Math.floor(n/4) + ':30' : Math.floor(n/4) + ':30');}
        else if(n % 4 == 3){times.push(n < 40 ? '0' + Math.floor(n/4) + ':45' : Math.floor(n/4) + ':45');}
      });

      return times;
    };

    service.sanitizeDates = function(date){
      date = date.match(' ') !== null ? date.replace(/\s/g, '-') : date;
      date = date.match('/') !== null ? date.replace(/\//g, '-') : date;

      return date;
    };

    service.getTimeZone = function(){
      var date = new Date();
      if(date.toString().match(/-(....) /) !== null){
        var timeZone = date.toString().match(/-(....)/)[1];
        return timeZone.substr(0,2) + ':' + timeZone.substr(2, 4)
      }
      else{
        return '';
      }
    };

    service.formatDate = function(date, time){
      time = time || '00:00';
      if(!date){
        return '';
      }
      return service.sanitizeDates(date) + 'T' + time +  ':00.000-' + service.getTimeZone();
    };

    service.getBrowserLanguage = function(){
      var language = navigator.language || navigator.userLanguage || 'en-US';
      console.log('Your current language is :', language);
      return language;
    };

    return service;
  }]);
})();
