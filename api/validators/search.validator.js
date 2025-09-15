import { check , query ,param } from "express-validator";
import { paginationValidator } from "./pagination.validator.js";
import validateRequest from '../utils/validateRequest.js';



export const unifiedSearchValidator = [
   ...paginationValidator ,
   
   query('search')
     .optional()
     .isString()
     .withMessage('Search has to be a string'),
   
   query('filter')
     .optional()
     .isString()
     .isIn(['all', 'products', 'services', 'sellers'])
     .withMessage('Filter must be one of: all, products, services, sellers'),

   (req , res , next) => validateRequest(req , res , next)

]