import express from 'express'

import * as claimStoreValidator from '../validators/store-claim-users.validator.js'
import * as claimStoreController from '../controllers/store-claim.controllers.js'
import   trimRequest  from 'trim-request';



const storeRoutes = express.Router()



storeRoutes.get(
               '/' ,
               trimRequest.all ,
               claimStoreValidator.validateGetStores ,
               claimStoreController.getStoresController
            )



export default storeRoutes

