import mongoose from 'mongoose'

const BlogsSchema = new mongoose.Schema({
    title: {
        type:String ,
        required:true ,
        index:true ,
    } ,
    author:{
        type:String ,
        required:true ,
    } ,

    content:{
        type:String ,
        required:true ,
    } ,

    description:{
        type:String ,
        required:true ,
    } ,
    coverImage:{
        type:String ,
        required:true ,
    }
} , {collection:"Blog" , timestamps:true})




BlogsSchema.pre('save', async function(next) {
  if (!this.isModified('title')) {
    return next();
  }
  
  const baseSlug = this.title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') 
    .trim(); 
  
  try {
    let slug = baseSlug;
    let count = 0;
    let existingTitle;
    
    do {
      if (count > 0) {
        slug = `${baseSlug}-${count}`;
      }
      
      existingTitle = await mongoose.models.Blog.findOne({ slug });
      count++;
    } while (existingTitle);
    
    this.slug = slug;
    next();
  } catch (error) {
    next(error);
  }
});

export default mongoose.model("Blog" , BlogsSchema)