import express from 'express'
import trimRequest from 'trim-request'

import * as locationControllers from '../controllers/location.controller.js'
import * as locationValidators from '../validators/location.validator.js'

const router = express.Router()

router.use(trimRequest.all)

router.get(
  '/countries',
  locationControllers.getCountriesController
)

router.get(
  '/states/:countryCode',
  locationValidators.getStatesByCountryValidator,
  locationControllers.getStatesByCountryController
)

router.get(
  '/cities/:countryCode/:stateCode',
  locationValidators.getCitiesByStateValidator,
  locationControllers.getCitiesByStateController
)

export default router