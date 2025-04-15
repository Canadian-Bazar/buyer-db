const mongoose = require('mongoose');

module.exports = [
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286101'),
    name: 'Electronics',
    slug: 'electronics',
    description: 'All electronic items including gadgets and devices',
    isActive: true,
    image: 'electronics.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286102'),
    name: 'Mobile Phones',
    slug: 'mobile-phones',
    description: 'Latest smartphones and accessories',
    isActive: true,
    parentCategory: '670fbc619aedcfcb30286101',
    ancestors: ['670fbc619aedcfcb30286101'],
    image: 'mobile-phones.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286103'),
    name: 'Laptops',
    slug: 'laptops',
    description: 'Range of laptops from various brands',
    isActive: true,
    parentCategory: '670fbc619aedcfcb30286101',
    ancestors: ['670fbc619aedcfcb30286101'],
    image: 'laptops.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286104'),
    name: 'Home Appliances',
    slug: 'home-appliances',
    description: 'Appliances for home use',
    isActive: true,
    image: 'home-appliances.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286105'),
    name: 'Kitchen Appliances',
    slug: 'kitchen-appliances',
    description: 'Small kitchen gadgets and tools',
    isActive: true,
    parentCategory: '670fbc619aedcfcb30286104',
    ancestors: ['670fbc619aedcfcb30286104'],
    image: 'kitchen.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286106'),
    name: 'Fashion',
    slug: 'fashion',
    description: 'Clothing and accessories',
    isActive: true,
    image: 'fashion.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286107'),
    name: 'Men Clothing',
    slug: 'men-clothing',
    description: 'Men shirts, trousers, jackets',
    isActive: true,
    parentCategory: '670fbc619aedcfcb30286106',
    ancestors: ['670fbc619aedcfcb30286106'],
    image: 'men-clothing.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286108'),
    name: 'Women Clothing',
    slug: 'women-clothing',
    description: 'Women dresses, tops, jeans',
    isActive: true,
    parentCategory: '670fbc619aedcfcb30286106',
    ancestors: ['670fbc619aedcfcb30286106'],
    image: 'women-clothing.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286109'),
    name: 'Books',
    slug: 'books',
    description: 'All genres of books',
    isActive: true,
    image: 'books.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286110'),
    name: 'Fiction',
    slug: 'fiction',
    description: 'Novels and fiction books',
    isActive: true,
    parentCategory: '670fbc619aedcfcb30286109',
    ancestors: ['670fbc619aedcfcb30286109'],
    image: 'fiction.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId('670fbc619aedcfcb30286111'),
    name: 'Non-Fiction',
    slug: 'non-fiction',
    description: 'Real stories and biographies',
    isActive: true,
    parentCategory: '670fbc619aedcfcb30286109',
    ancestors: ['670fbc619aedcfcb30286109'],
    image: 'non-fiction.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Gaming',
    slug: 'gaming',
    description: 'Gaming consoles and accessories',
    isActive: true,
    image: 'gaming.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Video Games',
    slug: 'video-games',
    description: 'Games for PS5, Xbox, PC',
    isActive: true,
    image: 'video-games.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Kids',
    slug: 'kids',
    description: 'Toys, books and clothes for kids',
    isActive: true,
    image: 'kids.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Toys',
    slug: 'toys',
    description: 'Toys for all age groups',
    isActive: true,
    image: 'toys.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Furniture',
    slug: 'furniture',
    description: 'Home and office furniture',
    isActive: true,
    image: 'furniture.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Living Room',
    slug: 'living-room',
    description: 'Sofas, TV units, decor',
    isActive: true,
    image: 'living-room.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Beds, mattresses, wardrobes',
    isActive: true,
    image: 'bedroom.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Sports',
    slug: 'sports',
    description: 'Sporting goods and fitness items',
    isActive: true,
    image: 'sports.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Fitness',
    slug: 'fitness',
    description: 'Fitness equipment and gym wear',
    isActive: true,
    image: 'fitness.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  // Extra 10 more to make 30
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Groceries',
    slug: 'groceries',
    description: 'Daily grocery essentials',
    isActive: true,
    image: 'groceries.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Snacks',
    slug: 'snacks',
    description: 'Chips, biscuits and more',
    isActive: true,
    image: 'snacks.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Stationery',
    slug: 'stationery',
    description: 'Office and school supplies',
    isActive: true,
    image: 'stationery.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Watches',
    slug: 'watches',
    description: 'Watches for men and women',
    isActive: true,
    image: 'watches.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Jewellery',
    slug: 'jewellery',
    description: 'Ornaments and accessories',
    isActive: true,
    image: 'jewellery.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Beauty',
    slug: 'beauty',
    description: 'Makeup and skincare products',
    isActive: true,
    image: 'beauty.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Pet Supplies',
    slug: 'pet-supplies',
    description: 'Food and toys for pets',
    isActive: true,
    image: 'pets.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Footwear',
    slug: 'footwear',
    description: 'Shoes, sandals, slippers',
    isActive: true,
    image: 'footwear.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Travel',
    slug: 'travel',
    description: 'Luggage, backpacks and travel gear',
    isActive: true,
    image: 'travel.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Automotive',
    slug: 'automotive',
    description: 'Car accessories and parts',
    isActive: true,
    image: 'automotive.jpg',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
