import express from 'express'

import * as notificationController from '../controllers/notifications.controller.js'
import * as notificationValidator from '../validators/notifications.validator.js'

import { requireAuth } from '../middlewares/auth.middleware.js'
import  trimRequest  from 'trim-request';

const router = express.Router() 


router.use(requireAuth)
router.use(trimRequest.all)

router.get(
    '/' , 
    notificationValidator.validateGetNotifications ,
    notificationController.getNotificationsController
)


router.put(
    '/:notificationId/mark-as-read' , 
    notificationValidator.validateMarkNotificationAsRead ,
    notificationController.markNotificationAsReadController
)

router.delete(
    '/:notificationId' , 
    notificationValidator.validateDeleteNotification ,
    notificationController.deleteNotificationController
)

router.put(
    '/mark-all-as-read' , 
    notificationValidator.validateMarkAllNotificationsAsRead ,
    notificationController.markAllNotificationsAsReadController
)


export default router