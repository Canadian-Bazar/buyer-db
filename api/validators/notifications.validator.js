import { check , query } from "express-validator";
import { paginationValidator } from "./pagination.validator.js";
import validateRequest from "../utils/validateRequest.js";


export const validateGetNotifications = [
    ...paginationValidator,
    query('read')
        .optional()
        .isBoolean()
        .withMessage('Read must be a boolean value'),
    query('time')
        .optional()
        .isString()
        .withMessage('Time must be a string')
        .isIn(['asc', 'desc',])
        .withMessage('Time must be either ascending or descending'),

    (req , res , next)=>validateRequest(req , res , next)
]


export const validateMarkNotificationAsRead = [
    check('notificationId')
        .exists().withMessage('Notification ID is required')
        .notEmpty().withMessage('Notification ID cannot be empty')
        .isString().withMessage('Notification ID must be a string')
        .isMongoId().withMessage('Notification ID must be a valid MongoDB ObjectId'),

    (req , res , next)=>validateRequest(req , res , next)
]

export const validateDeleteNotification = [
    check('notificationId')
        .exists().withMessage('Notification ID is required')
        .notEmpty().withMessage('Notification ID cannot be empty')
        .isString().withMessage('Notification ID must be a string')
        .isMongoId().withMessage('Notification ID must be a valid MongoDB ObjectId'),

    (req , res , next)=>validateRequest(req , res , next)
]

export const validateMarkAllNotificationsAsRead =[

    (req , res , next)=>validateRequest(req , res ,next)
]