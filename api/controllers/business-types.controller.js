import BusinessType from '../models/business-type.schema.js';
import buildResponse from '../utils/buildResponse.js';
import handleError from '../utils/handleError.js';
import httpStatus from 'http-status';





export const getBusinessTypesController = async (req, res) => {   
  try {
    const businessTypes = await BusinessType.find({}).sort({ name: 1 });
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK , businessTypes));
  } catch (err) {
    handleError(res, err);
  }
}
