import mongoose from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import paginate from 'mongoose-paginate-v2';
import { type } from 'os';

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    price: {
      type: Number,
      required: false,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    category: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
      required: false,
    },
    categoryName: {
      type: String,
      trim: true,
    },
    subcategory: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
    },
    subcategoryName: {
      type: String,
      trim: true,
    },
    images: [String],
    thumbnail: {
      type: String,
    },
    videos: [String],
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    isInStock: {
      type: Boolean,
      default: true,
    },
    weight: {
      type: Number,
      min: 0,
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: [
      {
        name: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    seller: {
      type: mongoose.Types.ObjectId,
      ref: 'Seller',
      required: true,
      index: true,
    },
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
    avgRating: {
      type: Number,
      default: 0.0,
      min: 0,
      max: 5,
    },
    ratingsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reviews: [
      {
        user: { type: mongoose.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 },
        comment: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    seoTitle: {
      type: String,
      trim: true,
    },
    seoDescription: {
      type: String,
      trim: true,
    },
    seoKeywords: [
      {
        type: String,
        trim: true,
      },
    ],
    city: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    about: [String],
    services: [String],
    descriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductDescription',
    },
    minPrice: {
      type: Number,
    },
    unitPrice: {
      type: Number,
    },
    maxPrice: {
      type: Number,
    },
    moq: {
      type: Number,
      default: null,
    },
    categoryId: {
      type: mongoose.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      required: true,
    },
    deliveryDays: {
      type: Number,
      required: true,
      default: 1,
    },
    isCustomizable: {
      type: Boolean,
      default: false,
      required: true,
    },
    isComplete: {
      type: Boolean,
      default: false,
      index: true,
    },
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    incompleteSteps: [
      {
        type: String,
        enum: ['productInfo', 'attributes', 'images', 'pricing', 'services'],
      },
    ],
    stepStatus: {
      productInfo: { type: Boolean, default: false },
      attributes: { type: Boolean, default: false },
      images: { type: Boolean, default: false },
      pricing: { type: Boolean, default: false },
      services: { type: Boolean, default: false },
    },
    brochure: {
      type: String,
      default: null,
    },
    isBlocked: {
      type: Boolean,
      default: false,
      required: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { timestamps: true, collection: 'Product' },
);

// Indexes (superset)
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ isVerified: 1 });
ProductSchema.index({ avgRating: -1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ rating: -1 });
ProductSchema.index({ createdAt: -1 });

ProductSchema.plugin(paginate);
ProductSchema.plugin(aggregatePaginate);

ProductSchema.pre('save', async function (next) {
  if (!this.isModified('name')) {
    return next();
  }

  const baseSlug = this.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  try {
    let slug = baseSlug;
    let count = 0;
    let existingProduct;

    do {
      if (count > 0) {
        slug = `${baseSlug}-${count}`;
      }

      existingProduct = await mongoose.models.Product.findOne({ slug });
      count++;
    } while (existingProduct);

    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model('Product', ProductSchema);
