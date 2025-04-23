import { check , param } from "express-validator";
import validateRequest from "../utils/validateRequest.js";


export const validateGetBusinessTypes = [
    (req , res , next)=>validateRequest(req , res , next)
]