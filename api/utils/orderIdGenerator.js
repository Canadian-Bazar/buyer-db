export const generateOrderId = async ()=>{
    const timestamp = Date.now(); 

    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  
    const pid = process.pid.toString().padStart(5, '0');

    const orderId = `${timestamp}-${random}-${pid}`;
}