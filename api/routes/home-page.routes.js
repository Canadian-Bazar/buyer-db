import express from 'express';
import * as homePageController from '../controllers/home-page.controller.js';
import * as homePageValidator from '../validators/home-page.validator.js';
import trimRequest from 'trim-request';

const homePageRoutes = express.Router();


homePageRoutes.get(
  '/recent-sellers',
  trimRequest.all,
  homePageValidator.validateGetRecentSellers,
  homePageController.getRecentSellers
);

homePageRoutes.get(
  '/landing-features',
  trimRequest.all,
  homePageValidator.validateGetLandingFeatures,
  homePageController.getLandingFeatures
);


export default homePageRoutes;