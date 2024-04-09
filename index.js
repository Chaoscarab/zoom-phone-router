require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const fetch = require("node-fetch");



//initializing express app
const app = express()



app.use(express.json({}))

//process.env.CERTDIR
///HTTPSPORT
//process.env.SECRETKEY

async function fetchFunc(object, url){
    console.log(object, url)
    try{
        const rawResponse = await fetch(url,{
            method: "POST", // or 'PUT'
            headers: {
              'Accept': 'application/json',
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(sendJson)
        });
        console.log(rawResponse)
        try {
           let passBack = await rawResponse.json()
           return passBack
            }catch{
                throw Error("invalid json fetch response")
            }
        
        }catch(e){
            console.log(e)
            throw Error(`Failed to fetch`)
        
        }
}


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
    }else if(req.body.event === 'phone.callee_ringing'){
        let outObj = {}
        outObj.timezone = req.body.payload.object.caller.timezone
        outObj.timezone = req.body.payload.object.caller.phone_number
        outObj.timezone = req.body.payload.object.caller.user_id
        outObj.status = 'ringing'
        console.log(outObj)
        fetchFunc(outObj, "https://services.leadconnectorhq.com/hooks/edoDpMHiDcicZUzruaOU/webhook-trigger/4f5b2324-e0d6-4f82-aa06-6766878b9d0f")
        res.status(200)
    }else if(req.body.event === 'phone.callee_missed'){
        let outObj = {}
        outObj.timezone = req.body.payload.object.caller.timezone
        outObj.timezone = req.body.payload.object.caller.phone_number
        outObj.timezone = req.body.payload.object.caller.user_id
        outObj.status = 'missed'
        console.log(outObj)
        fetchFunc(outObj, "https://services.leadconnectorhq.com/hooks/edoDpMHiDcicZUzruaOU/webhook-trigger/4f5b2324-e0d6-4f82-aa06-6766878b9d0f")
        res.status(200)
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
