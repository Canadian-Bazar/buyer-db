import {Vonage} from '@vonage/server-sdk'

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
})

function sendSMS(otp, phoneNumber) {
    const text = `Your OTP is ${otp}`;
    let to = phoneNumber;

    // Only override the phoneNumber in development environment
    if(process.env.NODE_ENV === 'development'){
        to = '917567138429';
    }

    to='+'+to
    console.log(to)
    
    const from = 'Canadian Bazaar';
    
    return new Promise((resolve, reject) => {
        vonage.sms.send({ to, from, text })
            .then(resp => {
                console.log('SMS sent successfully:', resp);
                resolve(resp);
            })
            .catch(err => {
                console.log('There was an error sending the messages.');
                console.error(err);
                reject(err);
            });
    });
}

export default sendSMS