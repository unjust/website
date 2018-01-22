var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Hola Mundo!' });
});

router.get('/work', function(req, res, next) {
  res.render('work', { title: 'Work' });
});

router.get('/play', function(req, res, next) {
  res.render('play', { title: 'Play' });
});

module.exports = router;
