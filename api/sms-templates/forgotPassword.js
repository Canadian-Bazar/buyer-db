export const getForgotPasswordBody = (otp)=>{
    return `Your OTP for password reset is ${otp}. Please use this OTP to reset your password. If you did not request this, please ignore this message.`
}