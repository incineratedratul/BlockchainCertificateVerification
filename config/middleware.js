const express = require('express');
const path = require('path');
const session = require('express-session');
const helmet = require('helmet');
const crypto = require('crypto');
const multer = require('multer');

const setupMiddleware = (app) => {
  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.static(path.join(__dirname, '..', 'uploads')));
  app.use('/public', express.static(path.join(__dirname, '..', 'public')));
  app.set('views', path.join(__dirname, '..', 'views'));
  app.set('view engine', 'ejs');
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
  }));
  app.use(helmet());

  app.use((req, res, next) => {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.nonce = nonce;
    res.setHeader("Content-Security-Policy", `
      default-src 'self'; 
      script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com; 
      style-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
      img-src 'self' data: https://cdn.jsdelivr.net; 
      connect-src 'self' http://localhost:5001; 
      font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
      object-src 'none'; 
      media-src 'self'; 
      frame-src 'none';
    `.replace(/\s{2,}/g, ' ').trim());
    next();
  });

  app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
  });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + '-' + file.originalname);
    },
  });

  const upload = multer({ storage });
  app.upload = upload;
};

module.exports = setupMiddleware;
