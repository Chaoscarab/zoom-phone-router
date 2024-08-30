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
        
        return output;
    }
}



app.use(express.json({}))

/
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
        console.log(rawResponse)
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


app.use(express.static(path.join(__dirname, "apps", "HighLevelAppBoilerplate",  'public' )))

app.get('/', async (req, res) => 
    {
   
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.get('/subscribe', (req, res) => {
     res.sendFile(path.join(__dirname, "apps","HighLevelAppBoilerplate",  'public', 'index.html'))

})


const tZandNmParser = (arg, arg2) => {
    let outObj = {type: arg2}
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


const zoomMissedParser = (arg) => {
    if(arg["payload"]["object"]["callee"]["phone_number"] === "+17725895500"){
       
        if(arg["payload"]["object"]["callee"]["device_type"].includes("PolycomVVX-VVX")){
           
            if(arg["payload"]["object"]["caller"]["phone_number"].length >=10){
                return true
            }else{
                return false
            }
        }else{
            return false
        }
    }else{
        return false
    }
}



app.post('/webhook', async (req, res) => {
    if (req.body.event === 'endpoint.url_validation') {
        let encryptedToken = crypto.createHmac('sha256', process.env.SECRETKEY).update(req.body.payload.plainToken).digest('hex');

        return res.json({
            plainToken: req.body.payload.plainToken,
            encryptedToken: encryptedToken
        })
        
    }else if(req.body.payload.object.caller.phone_number === '+17725895500'){
        return res.sendStatus(200)
    }else if(req.body.event === 'phone.callee_missed'){
        //let fetchObj = tZandNmParser(req.body.payload.object.caller, "missed")
        
            try{
                //let fetchObjMissed = await fetchFunc(fetchObj, process.env.HIGHLEVELURL)
               return  res.sendStatus(200)
            }catch(e){
                try{
                    //add zoom inbound errer workflow
                   // await fetchFunc({message: 'failed missed call trigger', phoneNumber: req.body["payload"]["object"]["callee"]["phone_number"]}, process.env.ZOOMINBOUNDERROR)
                }catch(e){
                    throw new Error(e)
                }
            }
    }else if (req.body.event === 'phone.callee_ringing'){ 
        let output = zoomMissedParser(req.body)
        if(output){
           // let fetchZoomMissed = tZandNmParser(req.body.payload.object.caller, 'ringing')
            try{
            //let output =  await fetchFunc(fetchZoomMissed, process.env.ZOOMINBOUND)
            res.sendStatus(200)
            }catch{
                try{
                //  await fetchFunc({message: 'failed ringing call trigger', phoneNumber: req.body["payload"]["object"]["callee"]["phone_number"]}, process.env.ZOOMINBOUNDERROR)
                }catch(e){
                    //throw new Error(e)
                }
            }
        }
    }else{
    res.sendStatus(200)
    }
})



app.get('/url', (req, res) => {
    if(process.env.REGISTERNEWUSER === 'false'){
        res.sendStatus(401)
    }else{
    let url = process.env.URL + process.env.REDIRECT + process.env.CLIENTIDURL + process.env.SCOPE
    res.json({url: url})}
})

app.get('/code', (req, res) => {
    if(process.env.REGISTERNEWUSER === 'false'){
    res.sendStatus(401)
}else{

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
        return 200
      }catch (e){
        console.log(e)
        return 500
      }
}





app.post('/app', async (req, res) => {
    if(req.headers.authorization === `Bearer ${process.env.HLBEARER}`){
        console.log('true app')
    }
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
            
            
        }else{
            console.log('refreshing keys')
            const refreshKeys = async (arg) => {
                let params = {
                    client_id: process.env.CLIENTID,
                    client_secret: process.env.CLIENTSECRET,
                    grant_type:'refresh_token',
                    refresh_token: arg.refresh_token,
                    
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
    if(req.headers.authorization === `Bearer ${process.env.HLBEARER}`){
        console.log('true mycasemisc')
    }
    let parseObj = await mycaseParse(req.body.customData)
console.log(parseObj)
    if(parseObj === false){
        let hlError = await fetchFunc({
            CaseID: req.body.email,
            Message: "invalid mycase ID",
            PhoneNumber: req.body.phone,}, process.env.HLERRORURL)
    }else{
    let outObj = req.body
    outObj.customData = parseObj
    try{
        
        let zapRes1 = await fetchFunc(outObj, process.env.MYCSMSCDTA)
        console.log(zapRes1)
        res.sendStatus(200)
    }catch{
        try{
            let hlError = await fetchFunc({
                CaseID: req.body.email,
                Message: "server miscdata upload Error",
                PhoneNumber: req.body.phone,}, process.env.HLERRORURL)
                res.sendStatus(200)
        }catch{
            throw new Error()
        }
    }
    }
    
    
    

})




app.listen(process.env.PORT, () => {

})
