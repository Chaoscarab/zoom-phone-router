require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion,} = require("mongodb");

//initializing express app
const app = express()



const uri = process.env.MONGODBURI;
const client = new MongoClient(uri,  {
        serverApi: {
            version: ServerApiVersion.v1,
            strict: true,
            deprecationErrors: true,
        }
    }
);


async function createDoc(arg){
    let output;
    try {
        await client.connect()
        const myDB = client.db('main')
        const myColl = myDB.collection('clientObjs')
        const result = await myColl.insertOne(arg)
        output = result
        console.log(result)
    }catch(e){
        console.log(e)
    }finally {
        await client.close()
        return output;
    }
}

async function readDoc(arg){
    let output;
    try {
        await client.connect()
        const myDB = client.db('main')
        const myColl = myDB.collection('clientObjs')
        const result = await myColl.findOne(arg)
        console.log(result)
        output = result;
    }catch(e){
        console.log(e)
    }finally {
        await client.close()
        return output;
    }
}

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
            }catch (e){
                console.log(e, 'error log at passback'
                )
                throw Error("invalid json fetch response")
            }
        
        }catch(e){
            console.log(e, 'error log at catch')
            throw Error(`Failed to fetch`)
        
        }
}



app.get('/', async (req, res) => 
    {
   
    res.sendFile(path.join(__dirname, '/index.html'));
})


//call log array
let callLog = []

const callPromise = async (arg) => {
//req.body.payload.object.callee.phone_number === arg
    callLog.push(arg);
    let promise = new Promise(function(resolve, reject) {
      setTimeout(() => {
        const indexToRemove = callLog.indexOf(arg);
        if (indexToRemove !== -1) {
          callLog.splice(indexToRemove, 1);
          resolve()
        }
      }, 20000);
    });
    }

//zoom webhook
app.post('/webhook', (req, res) => {
    console.log(callLog.length, 'callLog length')
    console.log(callLog.indexOf(req.body.payload.object.callee.phone_number) === -1)
    console.log('req.body', req.body, req.body.payload.object.callee )
    console.log('forwarded by', req.body.payload.object.forwarded_by)
    if (req.body.event === 'endpoint.url_validation') {
        let encryptedToken = crypto.createHmac('sha256', process.env.SECRETKEY).update(req.body.payload.plainToken).digest('hex');

        return res.json({
            plainToken: req.body.payload.plainToken,
            encryptedToken: encryptedToken
        })
        
    }else if(req.body.payload.object.caller.phone_number === '+17725895500'){
        res.sendStatus(200)
    }
    else if(req.body.event === 'phone.callee_missed'){

        
        let fetchObj = objectParser(req.body.payload.object.caller, 'missed')
        if(fetchObj === false){

        }else{
            
            fetchFunc(fetchObj, process.env.HIGHLEVELURL)
        }
        res.sendStatus(200)

    
    }else if (req.body.event === 'phone.callee_ringing' && req.body.payload.object.callee.phone_number === '+17725895500' && callLog.indexOf(req.body.payload.object.callee.phone_number) === -1){ 
        console.log('body:', req.body, "caller:", req.body.payload.object.caller, "callee:", req.body.payload.object.callee)
        
        //create promise for call log
        callPromise(req.body.payload.object.callee.phone_number)
        
        let fetchObj = objectParser(req.body.payload.object.caller, 'ringing')
        console.log('fetchObj', fetchObj)
        if(fetchObj === false || req.body.payload.object.hasOwnProperty('forwarded_by')){
console.log('forwared by', req.body.payload.object.forwarded_by)
        }else{
            console.log('webhook triggered')
            fetchFunc(fetchObj, process.env.ZOOMINBOUND)
        }
        res.sendStatus(200)
    }







})

//send to mycase outbound
app.post('/mycase', async(req, res) => {
let test = {phone: '000-000-0000'}
let check = await readDoc(test)
if(check){

    
}else{
    
     await createDoc(test)
    
}
res.status(200)
})



app.listen(process.env.PORT, () => {

})
