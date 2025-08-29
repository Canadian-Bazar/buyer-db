import { check , query ,param } from "express-validator";
import { paginationValidator } from "./pagination.validator.js";
import validateRequest from '../utils/validateRequest.js';



export const unifiedSearchValidator = [
   ...paginationValidator ,

   (req , res , next) => validateRequest(req , res , next)

]