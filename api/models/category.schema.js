import mongoose from 'mongoose'
import  paginate from 'mongoose-paginate-v2'
import  aggregatePaginate  from 'mongoose-aggregate-paginate-v2';


const CategorySchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }  ,
    parentCategory:{
        type:mongoose.Types.ObjectId ,
        ref:"Category" ,
        
    } ,

    ancestors:[
        {
            type:mongoose.Types.ObjectId ,
            ref:"Category" ,
            
        }
    ] ,

    image:{
        type:String 
    }

  }, { timestamps: true  , collection:'Category'});

CategorySchema.plugin(paginate);
CategorySchema.plugin(aggregatePaginate);



// Include virtuals in JSON/Object outputs (to expose coverImage to clients)
CategorySchema.set('toJSON', { virtuals: true });
CategorySchema.set('toObject', { virtuals: true });

// Virtual: derive filename/key from full image URL, matching admin behavior
CategorySchema.virtual('coverImage').get(function() {
  const image = this.image;
  if (!image || typeof image !== 'string') return undefined;
  const lastSlashIndex = image.lastIndexOf('/');
  return lastSlashIndex >= 0 ? image.substring(lastSlashIndex + 1) : image;
});

CategorySchema.methods.getTopMostParent = async function() {
  if (!this.parentCategory) {
    return this; // This is already the topmost parent
  }
  
  // Use ancestors array to find topmost parent efficiently
  if (this.ancestors && this.ancestors.length > 0) {
    const topmostId = this.ancestors[0];
    return await mongoose.model('Category').findById(topmostId);
  }
  
  // Fallback: traverse up the hierarchy
  let current = this;
  while (current.parentCategory) {
    current = await mongoose.model('Category').findById(current.parentCategory);
  }
  return current;
};

// Add this static method to efficiently build category hierarchy
CategorySchema.statics.buildCategoryHierarchy = async function(categoryId) {
  const category = await this.findById(categoryId).populate('ancestors');
  if (!category) return null;
  
  const hierarchy = [];
  
  // Add all ancestors (from topmost to immediate parent)
  if (category.ancestors && category.ancestors.length > 0) {
    for (const ancestorId of category.ancestors) {
      const ancestor = await this.findById(ancestorId);
      if (ancestor) hierarchy.push(ancestor);
    }
  }
  
  // Add the current category
  hierarchy.push(category);
  
  return {
    topMostParent: hierarchy[0] || category,
    fullHierarchy: hierarchy,
    currentCategory: category
  };
};

export default mongoose.model('Category', CategorySchema);