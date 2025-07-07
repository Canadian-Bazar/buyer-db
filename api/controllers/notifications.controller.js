import BuyerNotifications from '../models/notifications.schema.js'
import buildResponse from '../utils/buildResponse.js';
import handleError from '../utils/handleError.js';
import httpStatus from 'http-status';
import {matchedData} from 'express-validator'

export const getNotificationsController = async (req, res) => {
    try {
        const { page = 1, limit = 10, unread, time } = matchedData(req);
        const effectiveLimit = Math.min(limit, 50);
        const skip = (page - 1) * effectiveLimit;

        let query = { recipient: req.user._id };
        if (unread) {
            query.isRead = false;
        }

        const sortOrder = { createdAt: time === 'asc' ? 1 : -1 };

        // Get notifications with pagination
        const notifications = await BuyerNotifications.find(query)
            .sort(sortOrder)
            .skip(skip)
            .limit(effectiveLimit);

        // Get total count for pagination calculations
        const totalNotifications = await BuyerNotifications.countDocuments(query);

        // Calculate pagination metadata
        const totalPages = Math.ceil(totalNotifications / effectiveLimit);
        const currentPage = parseInt(page);
        const hasNext = currentPage < totalPages;
        const hasPrev = currentPage > 1;

        // Build response object with pagination
        const response = {
            docs: notifications,
            totalDocs: totalNotifications,
            limit: effectiveLimit,
            page: currentPage,
            totalPages,
            hasNext,
            hasPrev,
            nextPage: hasNext ? currentPage + 1 : null,
            prevPage: hasPrev ? currentPage - 1 : null
        };

        res.status(httpStatus.OK).json(
            buildResponse(httpStatus.OK, response)
        );

    } catch (err) {
        handleError(res, err);
    }
};





export const markNotificationAsReadController = async (req, res) => {
    try {
        const { notificationId } = matchedData(req);
        const notification = await BuyerNotifications.findById(notificationId);

        if (!notification) {
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Notification not found'));
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to access this notification'));
        }

        notification.isRead = true;
        await notification.save();

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Notification marked as read'));
    } catch (err) {
        handleError(res, err);
    }
}


export const deleteNotificationController = async (req, res) => {
    try {
        const { notificationId } = matchedData(req);
        const notification = await BuyerNotifications.findByIdAndDelete(notificationId);

        if (!notification) {
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Notification not found'));
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to access this notification'));
        }

        
        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Notification deleted successfully'));
    } catch (err) {
        handleError(res, err);
    }
}


export const archiveNotificationController = async (req, res) => {
    try {
        const { notificationId } = matchedData(req);
        const notification = await BuyerNotifications.findById(notificationId);

        if (!notification) {
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Notification not found'));
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to access this notification'));
        }

        notification.isArchived = true;
        await notification.save();

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Notification archived successfully'));
    } catch (err) {
        handleError(res, err);
    }
}


export const unarchiveNotificationController = async (req, res) => {
    try {
        const { notificationId } = matchedData(req);
        const notification = await BuyerNotifications.findById(notificationId);

        if (!notification) {
            return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Notification not found'));
        }

        if (notification.recipient.toString() !== req.user._id.toString()) {
            return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to access this notification'));
        }

        notification.isArchived = false;
        await notification.save();

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Notification unarchived successfully'));
    } catch (err) {
        handleError(res, err);
    }
}


export const getArchivedNotificationsController = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = matchedData(req);
        const effectiveLimit = Math.min(limit, 50);
        const skip = (page - 1) * effectiveLimit;

        const notifications = await BuyerNotifications.find({ recipient: req.user._id, isArchived: true })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(effectiveLimit);

        const totalNotifications = await BuyerNotifications.countDocuments({ recipient: req.user._id, isArchived: true });

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { notifications, totalNotifications }));
    } catch (err) {
        handleError(res, err);
    }
}


export const markAllNotificationsAsReadController = async (req, res) => {
    try {
        const query = { recipient: req.user._id, isRead: false };

        await BuyerNotifications.updateMany(query, { isRead: true });

        res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'All notifications marked as read'));
    } catch (err) {
        handleError(res, err);
    }
}

