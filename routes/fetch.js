const express = require('express');
const router = express.Router();

router.get('/fetch-ipfs', (req, res) => {
    res.render('fetch-ipfs', { nonce: res.locals.nonce });
});

module.exports = router;
