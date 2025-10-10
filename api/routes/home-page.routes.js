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

homePageRoutes.get(
  '/hero-settings',
  trimRequest.all,
  homePageValidator.validateGetHeroSettings,
  homePageController.getHeroSettings
);

homePageRoutes.get(
  '/hero-settings/list',
  trimRequest.all,
  homePageValidator.validateGetHeroSettings,
  homePageController.listHeroSettings
);


export default homePageRoutes;