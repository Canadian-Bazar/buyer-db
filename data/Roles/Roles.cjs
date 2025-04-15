const mongoose = require('mongoose')

module.exports = [
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb302862cc'),
    role: 'admin',
    label: 'ADMIN',
    description: null,
    createdAt: new Date('2024-10-16T00:00:00.000Z'),
    updatedAt: new Date('2024-10-16T00:00:00.000Z'),
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc699aedcfcb302862cd'),
    role: 'buyer',
    label: 'BUYER',
    description: null,
    createdAt: new Date('2024-10-16T00:00:00.000Z'),
    updatedAt: new Date('2024-10-16T00:00:00.000Z'),
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc6a9aedcfcb302862ce'),
    role: 'seller',
    label: 'SELLER',
    description: null,
    createdAt: new Date('2024-10-16T00:00:00.000Z'),
    updatedAt: new Date('2024-10-16T00:00:00.000Z'),
  },

]