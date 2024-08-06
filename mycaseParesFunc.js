
const mycaseParse = async (inputData) => {
    const dob = inputData.dob
    const spousedob = inputData.spouseDob
    const spousessn = inputData.spousessl
    const dod = inputData.dateOfDeath
    const ssn = inputData.ssn
    const mycaseId = inputData.mycaseID
    
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    let ordinals = [
        '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th',
        '11th', '12th', '13th', '14th', '15th', '16th', '17th', '18th', '19th', '20th',
        '21st', '22nd', '23rd', '24th', '25th', '26th', '27th', '28th', '29th', '30th',
        '31st', '32nd', '33rd'
    ]


    let outObj = {dob: "01/01/1875", spousedob: "01/01/1875", mycaseID: "F", dateOfDeath: "01/01/1875", ssn: "00000000", spousessn: '000-00-0000' }
    
    if(mycaseId.toString().length === 8){
       outObj.mycaseID = "T"
    }else{
       outObj.mycaseID = "F"
    }
    
    
    
    
    function hasWhiteSpace(s) 
    {
    if(typeof s != 'string'){
      return false
    }
        var reWhiteSpace = new RegExp("/^\s+$/");
    /**
        // Check for white space
        if (reWhiteSpace.test(s)) {
            //alert("Please Check Your Fields For Spaces");
            return false;
        }
        console.log(s)
       */
        if(s.includes("/")){
            return false
        }
        return true;
    }
    
    
    
    
    if(hasWhiteSpace(dob)){
      let output = ''
      let outdob = dob.split(' ')
      //[jan, 1st, 1990]
      output += months.findIndex((arg) => arg === outdob[0] ) + 1
      output += '/'
      output += ordinals.findIndex((arg) => arg === outdob[1] ) + 1
      output += '/' + outdob[2]
    
      let dobObj= new Date(output)
    outObj.dob = dobObj.toISOString();
    }else{
        
        let dobObj= new Date(dob)
        outObj.dob = dobObj.toISOString();
    }
    
    if(hasWhiteSpace(spousedob)){
        let sOutput = ''
        let outdob = spousedob.split(' ')
        //[jan, 1st, 1990]
        sOutput += months.findIndex((arg) => arg === outdob[0] ) + 1
        sOutput += '/'
        sOutput += ordinals.findIndex((arg) => arg === outdob[1] ) + 1
        sOutput += '/' + outdob[2]
        let dobObj = new Date(sOutput)
        outObj.spousedob  = dobObj.toISOString();
        
      }else{
          console.log('no white space')
        let spouseObj = new Date(spousedob);
          outObj.spousedob = spouseObj.toISOString();
      }
    
    
    if(hasWhiteSpace(dod)){
        let sOutput = ''
        let outdob = dod.split(' ')
        //[jan, 1st, 1990]
        sOutput += months.findIndex((arg) => arg === outdob[0] ) + 1
        sOutput += '/'
        sOutput += ordinals.findIndex((arg) => arg === outdob[1] ) + 1
        sOutput += '/' + outdob[2]
        let dobObj = new Date(sOutput)
        outObj.dateOfDeath= dobObj.toISOString();
        
      }else{
          console.log('no white space')
        let dodObj = new Date(dod);
          outObj.dateOfDeath = dodObj.toISOString();
      }
    
    let ssnFix = ssn.toString().replace('-', '')
    ssnFix = ssnFix.replace('-', '')
    ssnFix = ssnFix.replace('-', '')
    outObj.ssn = ssnFix


    const ssnParse = (arg) => {
        let ssnFix = arg.toString().replaceAll('-', '')
        return ssnFix
    }

    outObj.spousessn = ssnParse(spousessn)
    outObj.ssn = ssnParse(ssn)


if(outObj.mycaseID === 'F'){
    return false
}else{
    return outObj
}

} 

export default mycaseParse

