import express from 'express'

import * as serviceController from '../controllers/service.controller.js'
import * as serviceValidator from '../validators/service.validator.js'
import   trimRequest  from 'trim-request';


const router = express.Router();


router.get('/' ,
    trimRequest.all,
    serviceValidator.validateGetServices,
    serviceController.getServicesController
);


router.get('/:identifier' ,
    trimRequest.all,
    serviceValidator.validateGetServiceDetails,
    serviceController.getServiceDetailsController
);
export default router;
