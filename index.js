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
        const myColl = myDB.collection('clientKeys')
        const result = await myColl.insertOne(arg)
        output = result
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
        const myColl = myDB.collection('clientKeys')
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


const fileExtensionAppender = (file, filename) => {
let outString = filename;
if (file.includes('.pdf')) {
    outString = outString + ".pdf"
} else if (file.includes('.docx')) {
    outString = outString + ".docx"
} else if (file.includes('.doc')) {
    outString = outString + ".doc"
} else if (file.includes('.jpg')) {
    outString = outString + ".jpg"
} else if (file.includes('.jpeg')) {
    outString = outString + ".jpeg"
} else if (file.includes('.png')) {
    outString = outString + ".png"
} else if (file.includes('.gif')) {
    outString = outString + ".gif"
} else if (file.includes('.xls')) {
    outString = outString + ".xls"
} else if (file.includes('.csv')) {
    outString = outString + ".csv"
}

return outString
} 

app.use(express.static(path.join(__dirname, "apps", "HighLevelAppBoilerplate",  'public' )))

app.get('/', async (req, res) => 
    {
   
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/subscribe', (req, res) => {
    console.log(path.join(__dirname, "apps","HighLevelAppBoilerplate",  'public', 'index.html'))
     res.sendFile(path.join(__dirname, "apps","HighLevelAppBoilerplate",  'public', 'index.html'))

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
  /*  console.log(callLog.length, 'callLog length')
    console.log(callLog.indexOf(req.body.payload.object.callee.phone_number) === -1)
    console.log('req.body', req.body, req.body.payload.object.callee )
    console.log('forwarded by', req.body.payload.object.forwarded_by) */
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

    
    }else if (req.body.event === 'phone.callee_ringing' && req.body.payload.object.callee.phone_number === '+17725895500' && callLog.indexOf(req.body.payload.object.callee.phone_number) === -1 && !req.body.payload.object.hasOwnProperty){ 
       // console.log('body:', req.body, "caller:", req.body.payload.object.caller, "callee:", req.body.payload.object.callee)
        
        //create promise for call log
        callPromise(req.body.payload.object.callee.phone_number)
        
        let fetchObj = objectParser(req.body.payload.object.caller, 'ringing')
        //console.log('fetchObj', fetchObj)
        if(fetchObj === false || req.body.payload.object.hasOwnProperty('forwarded_by')){
        //console.log('forwared by', req.body.payload.object.forwarded_by)
        }else{
           // console.log('webhook triggered')
            fetchFunc(fetchObj, process.env.ZOOMINBOUND)
        }
        res.sendStatus(200)
    }







})


//send to mycase outbound
app.post('/mycase', async(req, res) => {

    console.log('mycase body:', req.body)
    const {
        mycaseId,
        name,
        email,
        phone,
        file1name,
        file2name,
        file3name,
        file4name,
        file5name,
        file6name,
        file7name,
        file8name,
        file9name,
        file10name,
        file1,
        file2,
        file3,
        file4,
        file5,
        file6,
        file7,
        file8,
        file9,
        file10,
        notes,
        notesCFCK
      } = req.body
      let promiseField = []

      if (file1 !== 'null') {
        let file1Name = fileExtensionAppender(file1, file1name);
        let outObj = { id: mycaseId, phone: phone, file: file1, filename: file1Name };
        let zapRes1 =  fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        console.log(zapRes1)
        promiseField.push(zapRes1);
      }
      
      if (file2 !== 'null') {
        let file2Name = fileExtensionAppender(file2, file2name);
        let outObj = { id: mycaseId, phone: phone, file: file2, filename: file2Name };
        let zapRes2 =  fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes2);
      }
      
      if (file3 !== 'null') {
        let file3Name = fileExtensionAppender(file3, file3name);
        let outObj = { id: mycaseId, phone: phone, file: file3, filename: file3Name };
        let zapRes3 =  fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes3);
      }
      
      if (file4 !== 'null') {
        let file4Name = fileExtensionAppender(file4, file4name);
        let outObj = { id: mycaseId, phone: phone, file: file4, filename: file4Name };
        let zapRes4 =  fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes4);
      }
      
      if (file5 !== 'null') {
        let file5Name = fileExtensionAppender(file5, file5name);
        let outObj = { id: mycaseId, phone: phone, file: file5, filename: file5Name };
        let zapRes5 = fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes5);
      }
      
      if (file6 !== 'null') {
        let file6Name = fileExtensionAppender(file6, file6name);
        let outObj = { id: mycaseId, phone: phone, file: file6, filename: file6Name };
        let zapRes6 = fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes6);
      }
      
      if (file7 !== 'null') {
        let file7Name = fileExtensionAppender(file7, file7name);
        let outObj = { id: mycaseId, phone: phone, file: file7, filename: file7Name };
        let zapRes7 = fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes7);
      }
      
      if (file8 !== 'null') {
        let file8Name = fileExtensionAppender(file8, file8name);
        let outObj = { id: mycaseId, phone: phone, file: file8, filename: file8Name };
        let zapRes8 = fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes8);
      }
      
      if (file9 !== 'null') {
        let file9Name = fileExtensionAppender(file9, file9name);
        let outObj = { id: mycaseId, phone: phone, file: file9, filename: file9Name };
        let zapRes9 = fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes9);
      }
      
      if (file10 !== 'null') {
        let file10Name = fileExtensionAppender(file10, file10name);
        let outObj = { id: mycaseId, phone: phone, file: file10, filename: file10Name };
        let zapRes10 = fetchFunc(outObj, process.env.MKDOCMYCSZAP);
        promiseField.push(zapRes10);
      }
      if (notes !== 'null') {
        const event = new Date('05 October 2011 14:48 UTC');
        let date = event.toString()
        let outObj = { id: mycaseId, phone: phone, notes: notes, date: date};
        let zapResNotes = fetchFunc(outObj, process.env.MKNOTEMYCSZAP);
        promiseField.push(zapResNotes);
      }

      try{
        await Promise.all(promiseField)
        console.log('allpromises complete')
        res.sendStatus(200)
      }catch (e){
        console.log(e)
        res.sendStatus(500)
      }
})

app.get('/url', (req, res) => {
    let url = process.env.URL + process.env.REDIRECT + process.env.CLIENTIDURL + process.env.SCOPE
    res.json({url: url})
})

app.get('/code', (req, res) => {
    console.log(req.query.code)

    const getKeys = async () => {
        let params = {
            client_id: process.env.CLIENTID,
            client_secret: process.env.CLIENTSECRET,
            grant_type:'authorization_code',
            code: req.query.code,
            
        }
        console.log(params)
        let outResponse = await fetch('https://services.leadconnectorhq.com/oauth/token',{
            method: "POST", // or 'PUT'
            headers: {
              'Accept': 'application/json',
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body:  new URLSearchParams(params)
        })
        let jsonRaw = await outResponse.json()
        console.log(jsonRaw)
        switch(jsonRaw.statusCode){
            case 401:
                console.log(jsonRaw.statusCode)
                break;
            case 200:
                let arg = {
                    access_token: jsonRaw.access_token,
                    token_type: jsonRaw.token_type,
                    expires_in: jsonRaw.expires_in,
                    refresh_token: jsonRaw.refresh_token,
                    scope: jsonRaw.scope,
                    userType: jsonRaw.userType,
                    locationId: jsonRaw.locationId,
                    companyId: jsonRaw.companyId,
                    approvedLocations: jsonRaw.approvedLocations,
                    userId: jsonRaw.userId,
                    planId: jsonRaw.planId
                    }
                    console.log(arg)
                createDoc(arg)
                break;
            default:
                console.log(jsonRaw.statusCode)
                break;

        }
        
    }
    try{
       getKeys() 
       res.send('data sent') 
    }catch(e){
        console.log(e)

    }

})


app.post('/app', async (req, res) => {
    console.log(req.body)
    const {userId} = {}
    try{
        const read = await readDoc({userId: userId})
        console.log(read)
        res.sendStatus(200)
    }catch(error){
        console.log(error)
    }
    
})
app.listen(process.env.PORT, () => {

})
