import express from 'express'

import * as searchController from '../controllers/search.controller.js'
import * as searchValidator from '../validators/search.validator.js'
import   trimRequest  from 'trim-request';


const searchRouter = express.Router();

searchRouter.get('/' , trimRequest.all , searchValidator.unifiedSearchValidator , searchController.unifiedSearchController) ;

export default searchRouter 
