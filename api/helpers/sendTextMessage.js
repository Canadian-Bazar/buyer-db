import twilio from 'twilio'


const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

console.log(accountSid ,authToken, twilioPhoneNumber)
const client = twilio(accountSid, authToken)




export const sendTextMessage = async (to, otp) => {
    try {
        console.log(accountSid ,authToken, twilioPhoneNumber)

        const body = `Your OTP to signup with Canadian Bazar is ${otp}. Do not share it with anyone.`;
        const message = await client.messages.create({
            body,
            from: twilioPhoneNumber,
            to,
        })
        return message
    } catch (error) {
        console.error('Error sending SMS:', error)
        throw error
    }
}