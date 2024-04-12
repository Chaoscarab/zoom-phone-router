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


    function objectParser(arg, arg2){
    let inObj = arg
    let outObj = {}
    outObj.type = arg2
    if(arg.hasOwnProperty('phone_number') && arg.phone_number.length >= 10){
        outObj.phone_number = arg.phone_number
    }else{
        console.log('returned false')
        return false
    }

    if(arg.hasOwnProperty('name')){
        outObj.name = arg.name
    }else{
        outObj.name = 'none'
    }

    if(arg.hasOwnProperty('timezone')){
        console.log('timeszone included')
        outObj.timezone = arg.timezone
    }else{
        console.log('timezone exclueded')
        outObj.timezone = 'none'
    }

    console.log(outObj, 'ObjectParser Output')
    return outObj

    }

async function fetchFunc(object, url){
    try{
        const rawResponse = await fetch(url,{
            method: "POST", // or 'PUT'
            headers: {
              'Accept': 'application/json',
              "Content-Type": "application/json"
            },
            credentials: "include",
            body: JSON.stringify(object)
        });
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
})


app.post('/webhook', (req, res) => {
    console.log(req.body.event)



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

    }else if(req.body.payload.object.caller.phone_number === '+17725895500'){
        console.log(req.body.payload.object)
        res.status(200)


    }else if(req.body.event === 'phone.callee_missed'){
    
        console.log(req.body.payload.object.caller)
        
        let fetchObj = objectParser(req.body.payload.object.caller, 'missed')
        if(fetchObj === false){

        }else{
            fetchFunc(fetchObj, process.env.HIGHLEVELURL)
        }
        res.status(200)

    }else if(req.body.event === 'phone.caller_connected'){
        console.log(req.body.payload.object.caller)

        let fetchObj = objectParser(req.body.payload.object.caller, 'connected')
        if(fetchObj === false){

        }else{
            fetchFunc(fetchObj, process.env.HIGHLEVELURL)
        }
        res.status(200)
        
    }







})


https
    .createServer({
        key: fs.readFileSync(process.env.CERTDIR + 'privkey.pem'),
        cert: fs.readFileSync(process.env.CERTDIR + 'fullchain.pem'),
      }, app)
      
    .listen(process.env.HTTPSPORT, () =>[
        console.log(`server is running at port ${process.env.HTTPSPORT}`)
    ])
