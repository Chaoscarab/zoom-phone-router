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

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})


app.post('/webhook', (req, res) => {
    console.log(req.body)
    res.status(200)

    const hmac = crypto.createHmac('sha256', 'qs0NKiOvQG2w0-z6XY_2Ig');
    data = hmac.update(request.body.payload.plainToken)
    gen_hmac = data.digest('hex');

    res.json({
       "plainToken": req.body.payload.plainToken,
       "encryptedToken": gen_hmac
    })
})
https
    .createServer({
        key: fs.readFileSync("../" + 'privkey.pem'),
        cert: fs.readFileSync("../" + 'fullchain.pem'),
      }, app)
      
    .listen(443, () =>[
        console.log(`server is running at port ${443}`)
    ])
