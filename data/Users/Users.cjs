const mongoose = require('mongoose')

module.exports = [
  {
    _id: new mongoose.Types.ObjectId('67707eba29571f4e14a66acf'),
   
    fullName: 'Super admin',
    email: 'user@gmail.com',
    password: '$2b$10$H4WvitrMsVbDQiSZStCMtOjXdJ6eeC3e.iQ48IaNVieWYXxGuAnQ2',
    blockExpires: new Date('2024-10-16T00:00:00.000Z'),
    loginAttempts: 0,
    roleId: new mongoose.Types.ObjectId('670fbc619aedcfcb302862cc'),
    createdAt: new Date('2024-10-16T00:00:00.000Z'),
    updateAt: new Date('2024-10-16T00:00:00.000Z'),
  },
]
