import  jwt from 'jsonwebtoken';
import encrypt from './encrypt';



export const generateInvoiceToken = (invoiceId)=>{
    return encrypt(
        jwt.sign(
            { invoiceId },   process.env.INVOICE_SECRET ,{
                expiresIn:process.env.INVOICE_EXPIRATION
            }

        )
    )
}
