import { param } from "express-validator";
import validateRequest from "../utils/validateRequest.js";


export const validateImageProxy = [
    param('fileName')
        .exists()
        .withMessage('File name is required')
        .isString()
        .withMessage('File name must be a string')
        .trim() ,

    (req, res, next) => validateRequest(req, res, next)
]