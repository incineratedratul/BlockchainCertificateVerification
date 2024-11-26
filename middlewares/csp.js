const crypto = require("crypto");

module.exports = (req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  res.locals.nonce = nonce;
  res.setHeader(
    "Content-Security-Policy",
    `
    default-src 'self'; 
    script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com; 
    style-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
    img-src 'self' data: https://cdn.jsdelivr.net; 
    connect-src 'self' http://localhost:5001; 
    font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdnjs.cloudflare.com; 
    object-src 'none'; 
    media-src 'self'; 
    frame-src 'none';
  `
      .replace(/\s{2,}/g, " ")
      .trim()
  );
  next();
};
