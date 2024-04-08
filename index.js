//require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const fs = require('fs');

//initializing express app
const app = express()







app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

https
    .createServer({
        key: fs.readFileSync('../../../etc/letsencrypt/live/www.fecundfigwebservices.com/privkey.pem'),
        cert: fs.readFileSync('../../../etc/letsencrypt/live/www.fecundfigwebservices.com/fullchain.pem'),
      }, app)
      
    .listen(443, () =>[
        console.log(`server is running at port ${process.env.HTTPSPORT}`)
    ])