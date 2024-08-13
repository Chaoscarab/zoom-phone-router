
const mycaseParse = async (inputData) => {
    console.log("input data", inputData)
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


    let outObj = {dob: "01/01/1875", spouseDob: "01/01/1875", mycaseID: "F", dateOfDeath: "01/01/1875", ssn: "00000000", spousessl: '000-00-0000', email: inputData.email}
    
        
    if(mycaseId.toString().length === 8){
       outObj.mycaseID = "T"
    }else{
       outObj.mycaseID = "F"
    }
    function hasNoDash(s){
        if(typeof s != 'string'){
            return false
        }
        if(s.includes("/")){
            return false
        }
        return true;
    }

    
    const datetoIOS = (arg) => {
        arg = arg.replaceAll(',', '')
        if(arg === '' || arg === " "){
            return ''
        }else{
            if(hasNoDash(arg)){
                if(arg.includes("-")){

                    let dashDate = new Date(arg)
                    return dashDate.toISOString();


                }else{
                let output = ''
                console.log('argument', arg)
                let outdob = arg.split(' ')
                //[jan, 1st, 1990]
                output += months.findIndex((arg) => outdob[0].includes(arg)) + 1
                output += '/'
                
                function containsOrdinal(str) {
                    const regex = /\d+(st|nd|rd|th)\b/;
                    return regex.test(str);
                  }
                  if(containsOrdinal(outdob[1])){
                    output += ordinals.findIndex((arg) => arg.includes(outdob[1])) + 1
                  }else{
                    output += outdob[1] 
                  }
                
                output += '/' + outdob[2]
                console.log("date output", output)
                let dobObj= new Date(output)
            return dobObj.toISOString();
           } }else{
                let dobObj= new Date(dob)
                return  dobObj.toISOString();
            }
        }
        
    }


    outObj.dob = datetoIOS(dob)

    outObj.spouseDob = datetoIOS(spousedob)
    outObj.dateOfDeath = datetoIOS(dod)


    const ssnParse = (arg) => {
        let ssnFix = arg.toString().replaceAll('-', '')
        return ssnFix
    }

    outObj.spousessl = ssnParse(spousessn)
    outObj.ssn = ssnParse(ssn)

if(outObj.mycaseID === 'F'){
    return false
}else{
    return outObj
}

} 

module.exports = mycaseParse

