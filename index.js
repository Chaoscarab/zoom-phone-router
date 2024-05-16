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
    let outObj = {}
    outObj.type = arg2
    if(arg.hasOwnProperty('phone_number') && arg.phone_number.length >= 10){
        outObj.phone_number = arg.phone_number
    }else{

        return false
    }

    if(arg.hasOwnProperty('name')){
        outObj.name = arg.name
    }else{
        outObj.name = 'none'
    }

    if(arg.hasOwnProperty('timezone')){
       
        outObj.timezone = arg.timezone
    }else{
     
        outObj.timezone = 'none'
    }

  
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

//zoom webhook
app.post('/webhook', (req, res) => {




    if (req.body.event == 'endpoint.url_validation') {
        let encryptedToken = crypto.createHmac('sha256', process.env.SECRETKEY).update(req.body.payload.plainToken).digest('hex');

        return res.json({
            plainToken: req.body.payload.plainToken,
            encryptedToken: encryptedToken
        })
        
    }else if(req.body.payload.object.caller.phone_number === '+17725895500'){
        res.status(200)


    }
    else if(req.body.event === 'phone.callee_missed'){
    
        
        let fetchObj = objectParser(req.body.payload.object.caller, 'missed')
        if(fetchObj === false){

        }else{
            fetchFunc(fetchObj, process.env.HIGHLEVELURL)
        }
        res.status(200)

    
    }else if (req.body.event === 'phone.callee_ringing'){
        let fetchObj = objectParser(req.body.payload.object.caller, 'ringing')
        if(fetchObj === false){

        }else{
            console.log(req.body.payload, req.body.payload.forwarded_by)
            fetchFunc(fetchObj, process.env.ZOOMINBOUND)
        }
        res.status(200)
    }







})

//mycase webhook


app.listen(process.env.PORT, () => {

})
