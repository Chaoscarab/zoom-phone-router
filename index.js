//require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');

//initializing express app
const app = express()







app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

https
    .createServer({
        key: fs.readFileSync(process.env.CERTDIR + 'privkey.pem'),
        cert: fs.readFileSync(process.env.CERTDIR + 'fullchain.pem'),
      }, app)
      
    .listen(process.env.HTTPSPORT, () =>[
        console.log(`server is running at port ${process.env.HTTPSPORT}`)
    ])