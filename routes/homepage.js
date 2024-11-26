const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('homepage', { user: req.session });
});

router.get('/about', (req, res) => {
  res.render('pages/about', { user: req.session });
});

router.get('/contact', (req, res) => {
  res.render('pages/contact', { user: req.session });
});

router.get('/login', (req, res) => {
  res.render('pages/login', { user: req.session });
});

router.get('/register', (req, res) => {
  res.render('pages/register', { user: req.session });
});

module.exports = router;
