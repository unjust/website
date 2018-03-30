var express = require('express');
var path = require("path");
var router = express.Router();

/* GET home page. */

router.get('/', function(req, res, next) {
  res.render('index', { title: 'Hello!!!' });
  // res.sendFile(path.resolve(__dirname, '../', 'index.html'));
  // res.sendFile('index.html', { root: __dirname });
  // res.render('index_theme', { title: 'Hola Mundo!' });
});

router.get('/work', function(req, res, next) {
  res.render('work', { title: 'Work' });
});

router.get('/play', function(req, res, next) {
  res.render('play', { title: 'Play' });
});

module.exports = router;
