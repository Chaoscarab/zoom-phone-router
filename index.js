require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');



//initializing express app
const app = express()



app.use(express.json({}))

//process.env.CERTDIR
///HTTPSPORT
//process.env.SECRETKEY

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
    console.log(process.env.HTTPSPORT)
})


app.post('/webhook', (req, res) => {
    console.log(req.body)
    console.log(req.body.event, req.body.event === 'endpoint.url_validation')

    if(req.body.event === 'endpoint.url_validation'){
            console.log(req.body)
            res.status(200)

            const hmac = crypto.createHmac('sha256', process.env.SECRETKEY);
            data = hmac.update(req.body.payload.plainToken)
            gen_hmac = data.digest('hex');

            res.json({
            "plainToken": req.body.payload.plainToken,
            "encryptedToken": gen_hmac
            })
    }
})
https
    .createServer({
        key: fs.readFileSync(process.env.CERTDIR + 'privkey.pem'),
        cert: fs.readFileSync(process.env.CERTDIR + 'fullchain.pem'),
      }, app)
      
    .listen(process.env.HTTPSPORT, () =>[
        console.log(`server is running at port ${443}`)
    ])
