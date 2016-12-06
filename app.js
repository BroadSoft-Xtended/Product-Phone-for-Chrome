var express = require('express');
var app = express();
var path = require('path');

app.use(express.static('.tmp/public'));

// viewed at http://localhost:8080
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/.tmp/public/index.html'));
});
console.log('listening on port 8080');

app.listen(8080);
