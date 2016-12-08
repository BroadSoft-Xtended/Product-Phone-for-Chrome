var express = require('express');
var path = require('path');
var cors = require('cors');
var bodyParser = require('body-parser');
var rp = require('request-promise');
var parser = require('xml2json');

var app = express();

//You will need to enable cors in order to receive request from our servers
app.use(cors({
  "origin": "http://localhost:8080",
  "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
  "preflightContinue": true,
  "credentials": true
}));

app.use(express.static('.tmp/public'));

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var router = express.Router(); // get an instance of the express Router

router.options('/*', function(req, res) {
  res.send(200, 'CHECKOUT,CONNECT,COPY,DELETE,GET,HEAD,LOCK,M-SEARCH,MERGE,MKACTIVITY,MKCALENDAR,MKCOL,MOVE,NOTIFY,PATCH,POST,PROPFIND,PROPPATCH,PURGE,PUT,REPORT,SEARCH,SUBSCRIBE,TRACE,UNLOCK,UNSUBSCRIBE');
});

router.post('/proxy', function(req, res) {
  console.log();

  var options = {
    url: req.body.url,
    auth: {
      user: req.body.username,
      password: req.body.password
    }
  };

  console.log(options.url);

  rp(options)
    .then(function (response) {
      // console.log('***RESPONSE***', response);
      if(response.match('</')){
        res.send(parser.toJson(response));
      }
      else{
        res.send(response);
      }
    })
    .catch(function (err) {
      console.log('*********ERROR******** ');
      console.log('message: ', err.message);
      console.log('message: ', err.options);
      console.log('message: ', err.body);
      res.json(500, err);
    });
});


app.use(router);
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/.tmp/public/index.html'));
});
console.log('listening on port 8080');

app.listen(8080);
