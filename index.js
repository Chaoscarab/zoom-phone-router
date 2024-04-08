//require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');



//initializing express app
const app = express()



app.use(express.json({}))

//CERTDIR
///HTTPSPORT
//SECRETKEY

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
    console.log(process.env.HTTPSPORT)
})


app.post('/webhook', (req, res) => {

    if(req.body.event === 'endpoint.url_validation'){
            console.log(req.body)
            res.status(200)

            const hmac = crypto.createHmac('sha256', 'qs0NKiOvQG2w0-z6XY_2Ig');
            data = hmac.update(req.body.payload.plainToken)
            gen_hmac = data.digest('hex');

            res.json({
            "plainToken": req.body.payload.plainToken,
            "encryptedToken": gen_hmac
            })
    }

    3
    
})
https
    .createServer({
        key: fs.readFileSync("../" + 'privkey.pem'),
        cert: fs.readFileSync("../" + 'fullchain.pem'),
      }, app)
      
    .listen(443, () =>[
        console.log(`server is running at port ${443}`)
    ])
