import Products from '../models/products.model.js';
import buildResponse from '../utils/buildResponse.js';
import handleError from '../utils/handleError.js';
import httpStatus from 'http-status';   






export const getProductsController = async (req, res) => {
  try {
    const validatedData = matchedData(req);
    const page = Math.max(parseInt(validatedData.page) || 1, 1);
    const limit = Math.min(parseInt(validatedData.limit) || 10, 50);
    const skip = (page - 1) * limit;
    const sellerId = req.user._id;

    const  filter = {}




    //find the produt ids of all the sellers that belongs to him

    const productsIds = await Products.find({ sellerId }, { _id: 1 })

    

 



    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (error) {
    handleError(res, error);
  }
}