import Language from '../models/language.model.js';
import buildResponse from '../utils/buildResponse.js';
import handleError from '../utils/handleError.js';
import { matchedData } from 'express-validator';
import  httpStatus  from 'http-status';


export const getLanguagesController = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        const totalLanguages = await Language.countDocuments({});
        const languages = await Language.find({})
            .select('-__v -createdAt -updatedAt')
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(totalLanguages / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, {
            docs:languages,
            totalPages,
            hasNext,
            hasPrev,
        }));
        
    } catch (err) {
        handleError(res, err);
    }
}