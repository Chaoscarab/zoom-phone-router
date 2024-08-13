//call log array
let callLog = []


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
        if(req.body.event === 'phone.callee_missed'){

        
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





const zoomPhoneParser = (arg) => {

}

module.exports = zoomPhoneParser
