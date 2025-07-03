import BuyerNotifications from '../models/buyer-notifications.schema.js';





const sendNotification = (data) => {
  return new Promise((resolve, reject) => {
    resolve()
    ;(async () => {
      try {
        const notification = new BuyerNotifications(data)
        await notification.save()
        console.log('Notification sent successfully')
      } catch (err) {
        reject(err)
      }
    })()
  })
}


export default sendNotification