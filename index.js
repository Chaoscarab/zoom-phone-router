require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion,} = require("mongodb");
const mycaseParse = require('./mycaseParesFunc')

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
        output = result;
    }catch(e){
        console.log(e)
    }finally {
        await client.close()
        return output;
    }
}

async function updateDoc(fieldtoUpdate, updateObject){
    let output;
    try {
        await client.connect()
    const myDB = client.db('main')
    const myColl = myDB.collection('clientObjs')
    const result = await myColl.updateOne(fieldtoUpdate, {$set: updateObject})
    output = result;
    }catch(e){
        console.log(e)
    }finally {
        await client.close()
        console.log(output)
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
    const getKeys = async () => {
        let params = {
            client_id: process.env.CLIENTID,
            client_secret: process.env.CLIENTSECRET,
            grant_type:'authorization_code',
            code: req.query.code,
            
        }
        let outResponse = await fetch('https://services.leadconnectorhq.com/oauth/token',{
            method: "POST", // or 'PUT'
            headers: {
              'Accept': 'application/json',
              "Content-Type": "application/x-www-form-urlencoded"
            },
            body:  new URLSearchParams(params)
        })
        let jsonRaw = await outResponse.json()
        switch(outResponse.status){
            case 401:
                console.log(jsonRaw.statusCode)
                break;
            case 200:
                let argObj = {
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
                    
                await createDoc(argObj)
                break;
            default:
                
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

const hlContactFetch = async (creds, arg) => {
        const apiCall = await fetch(`https://services.leadconnectorhq.com/contacts/${arg}/?locationId=` + creds.locationId, {
            method: "GET", // or 'PUT'
            headers: {
                'Authorization': `Bearer ${creds.access_token}`,
                "Version": '2021-07-28',
              'Accept': 'application/json',
              "Content-Type": "application/json"
            },
            credentials: "include",
        });
        let responseObj = await apiCall.json()
        return {body: responseObj, status: apiCall.status}
}

const hlNotesFetch = async (creds, arg) => {
    const apiCall = await fetch(`https://services.leadconnectorhq.com/contacts/${arg}/notes/?locationId=` + creds.locationId, {
        method: "GET", // or 'PUT'
        headers: {
            'Authorization': `Bearer ${creds.access_token}`,
            "Version": '2021-07-28',
          'Accept': 'application/json',
          "Content-Type": "application/json"
        },
        credentials: "include",
    });
    let responseObj = await apiCall.json()
    return {body: responseObj, status: apiCall.status}
}

const customValsFileMap = (arg) => {
    let fileArray = []
    const  fields = arg.body.contact
    fields.customFields.forEach((cvalue) => {
        if(typeof cvalue.value === 'object'){
            for (const [key, value] of Object.entries(cvalue.value)) {
                if(value.hasOwnProperty('meta') && value.hasOwnProperty('documentId') && value.hasOwnProperty('url')){
                    let returnObj = {
                        fileName: value.meta.originalname,
                        url: value.url
                    }
                    fileArray.push(returnObj)
                }
              }
        }
        
    })
    //console.log(fields, 'custom fields:', fields.customFields[1].value['efdf5a18-862b-40b5-9810-b055f4fef05f'].meta.originalname)
return fileArray
} 

const notesMap = (arg) => {
    let outArr = []
    arg.forEach((note) => {
        let outObj = {
            body: note.body,
            dateAdded: note.dateAdded
        }
        outArr.push(outObj)
    })
    return outArr
}

const myCaseUpload = async (files, notes, caseId) => {
      let promiseField = []
console.log(files, notes)
      files.forEach(async (file) => {
        let outObj = { id: caseId, file: file.url, filename: file.fileName };
        let zapRes1 = await fetchFunc(outObj, process.env.MKDOCMYCSZAP)
        promiseField.push(zapRes1)
      })

      notes.forEach((note) => {
        //body: note.body, dateAdded: note.dateAdded
        let outObj = { id: caseId,  notes: note.body, date: note.dateAdded};
        let zapResNotes = fetchFunc(outObj, process.env.MKNOTEMYCSZAP);
        promiseField.push(zapResNotes);
      })

      try{
        await Promise.all(promiseField)
        console.log('allpromises complete')
        return 200
      }catch (e){
        console.log(e)
        return 500
      }
}





app.post('/app', async (req, res) => {
    console.log("request body:", req.body)
    //req schema req.body = {userId: <id>, hluserID}
    const userId = req.body.customData.userId
    let mycaseId = req.body['MyCase ID']
   
    
    try{
        const read = await readDoc({userId: userId})
        let getContact = await hlContactFetch(read, req.body.contact_id)
        //schema to docname is getContact.body.contact.customFields[1].value['efdf5a18-862b-40b5-9810-b055f4fef05f'].meta.originalname or getContact.body.contact.customFields[<array index>].value[<document key>].meta.originalname
        //schema to url getContact.body.contact.customFields[<array index>].value[<document key>].url
        
        if(getContact.status === 200){
            let ffRes = await hlNotesFetch(read, req.body.contact_id)

           let values =  customValsFileMap(getContact)
           let notes = notesMap(ffRes.body.notes)
           let mycaseUpload = await myCaseUpload(values, notes, mycaseId)
           if(mycaseUpload === 200){
            res.sendStatus(200)
           }else{
            console.log('issue with mycaseUpload')
            res.sendStatus(500)
           }

           
        //console.log(getContact)
        //console.log(getContact, 'custom fields:', getContact.body.contact.customFields[1].value['efdf5a18-862b-40b5-9810-b055f4fef05f'].meta.originalname)
           
            
            
        }else{
            console.log('refreshing keys')
            const refreshKeys = async (arg) => {
                let params = {
                    client_id: process.env.CLIENTID,
                    client_secret: process.env.CLIENTSECRET,
                    grant_type:'refresh_token',
                    refresh_token: arg.refresh_token,
                    
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
                console.log(outResponse.status, 'statuscode')
                switch(outResponse.status){
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
                        await updateDoc({userId: userId}, arg)
                        break;
                    default:
                        console.log(jsonRaw.statusCode)
                        break;
        
                }

                
                

        
        
            }
            await refreshKeys(read)
            const readagain = await readDoc({userId: userId})



            let contactFetchagain = await hlContactFetch(readagain, req.body.contact_id)
            if(contactFetchagain.status === 200){
                let ffRes = await hlNotesFetch(read, req.body.contact_id)
    
               let values =  customValsFileMap(contactFetchagain)
               let notes = notesMap(ffRes.body.notes)
               let mycaseUpload = await myCaseUpload(values, notes, mycaseId)
               if(mycaseUpload === 200){
                res.sendStatus(200)
            }else{
                res.sendStatus(500)
            }
            }else{

                res.sendStatus(500)
            }
                        

        }

        

       

    }catch(error){
        console.log(error)
    }
        
    
})

app.post('/mycasemisc', async (req, res) => {
    let parseObj = await mycaseParse(req.body.customData)

    console.log("parsed obj", parseObj)
    console.log(req.body)
    if(parseObj === false){
        let hlError = await fetchFunc({
            CaseID: req.body.email,
            Message: "invalid mycase ID",
            PhoneNumber: req.body.phone,}, process.env.HLERRORURL)
    }else{
    let outObj = req.body
    outObj.customData = parseObj
    try{
        console.log("outObj", outObj, "req.body", req.body)
        let zapRes1 = await fetchFunc(outObj, process.env.MYCSMSCDTA)
        console.log(zapRes1)
        res.sendStatus(200)
    }catch{
        try{
            let hlError = await fetchFunc({
                CaseID: req.body.email,
                Message: "server miscdata upload Error",
                PhoneNumber: req.body.phone,}, process.env.HLERRORURL)
        }catch{
            throw new Error()
        }
    }
    }
    
    
    

})

app.listen(process.env.PORT, () => {

})
