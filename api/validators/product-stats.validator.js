import { matchedData } from "express-validator";
import { query , body , param } from "express-validator";
import { paginationValidator } from "./pagination.validator.js";
import validateRequest from "../utils/validateRequest.js";


export const validateTrackProductView = [
    param('productId')
      .isString()
      .withMessage('Product ID is required'),
      (req  , res , next) => validateRequest(req , res , next)
    
  ];
  
  export const validateTrackQuotationStatus = [
    body('quotationId')
      .isString()
      .withMessage('Quotation ID is required'),
    body('productId')
      .isString()
      .withMessage('Product ID is required'),
    body('status')
      .isString()
      .isIn(['sent', 'in-progess', 'accepted', 'rejected'])
      .withMessage('Valid status is required'),

      (req  , res , next) => validateRequest(req , res , next)
    
  ];



  export const validateGetPopularProducts =[
    ...paginationValidator , 
    (req , res , next) => validateRequest(req , res , next)
  ]


  export const validateGetBestsellerProducts =[
    ...paginationValidator ,
    (req , res, next) => validateRequest(req , res  , next)
  ]


