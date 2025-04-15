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

export default mongoose.model('Category', CategorySchema);