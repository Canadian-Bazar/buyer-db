import Career from '../models/career.schema.js';
import httpStatus from 'http-status';
import handleError from '../utils/handleError.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import {matchedData }from 'express-validator'
import { uploadFile } from '../helpers/aws-s3.js';
import buildResponse from '../utils/buildResponse.js';
import Buyer from '../models/buyer.schema.js';
import sendMail from '../helpers/sendMail.js';
import BuyerAddress from '../models/buyer-address.schema.js';
import generateVerificationToken from '../utils/generateVerificationToken.js';
import Category from '../models/category.schema.js';
import decrypt from '../utils/decrypt.js';
import jwt from 'jsonwebtoken';


/** * @desc Create a new career application
 * @route POST /api/career
 * @access Public
 */

export const createCareer = async (req, res) => {
  try {
    const validatedData = matchedData(req, { locations: ['body'] });
    const userId = req.user?._id;

    const user = await Buyer.findById(userId).select('email phoneNumber fullName');
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found');
    }

    let token = null;
    if (validatedData.email !== user.email) {
      validatedData.isVerified = false;
      token = generateVerificationToken({email:validatedData.email});
    } else {
      validatedData.isVerified = true;
    }




    if (!req.files || req.files.length === 0) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No resume file uploaded');
    }

    const uploadedFiles = await uploadFile(req.files);
    validatedData.resume = uploadedFiles[0];

    const categoryExists = await Category.exists({
      _id: validatedData.category,
      isActive: true,
    });
    if (!categoryExists) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'No such category found');
    }

    const existingCareer = await Career.findOne({
      email: validatedData.email,
      isVerified: { $exists: true },
    });

    let careerEntry;
    if (existingCareer) {
      careerEntry = await Career.findByIdAndUpdate(
        existingCareer._id,
        {
          $set: {
            ...validatedData,
            updatedAt: new Date(),
          },
        },
        { new: true }
      );
    } else {
      careerEntry = await Career.create({
        ...validatedData,
        userId: userId,
      });
    }

    if (!validatedData.isVerified && token) {
      await sendMail(validatedData.email, 'career-application.ejs', {
        subject: 'Verify Your Career Application',
        fullName: user.fullName,
        token,
        frontendURL: process.env.FRONTEND_URL,
      });
    }

    res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, 'Career application saved successfully')
    );
  } catch (err) {
    handleError(res, err);
  }
};



export const getDataToPrefill = async (req, res) => {
  try {
    const userId = req.user?._id;
    const user = await Buyer.findById(userId).select('email phoneNumber fullName');
    if (!user) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'User not found');
    }

    const buyerAddress = await BuyerAddress.findOne({ buyerId: userId, isDefault: true });

    const existingCareer = await Career.findOne({ email: user.email }).select('resume');

    const prefillData = {
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      fullName: user.fullName || '',
      street: buyerAddress?.street || '',
      city: buyerAddress?.city || '',
      state: buyerAddress?.state || '',
      postalCode: buyerAddress?.postalCode || '',
      resume: existingCareer?.resume || '',  
    };

    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, prefillData));
  } catch (err) {
    handleError(res, err);
  }
};


export const verifyEmail = async (req, res) => {
  try {
    const validatedData = matchedData(req, { locations: ['body'] });
    const { token } = validatedData;

    if (!token) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Token is required');
    }

    let decryptedToken, payload;
    try {
      decryptedToken = decrypt(token);
      payload = jwt.verify(decryptedToken, process.env.VERIFICATION_SECRET);
    } catch (error) {
      throw buildErrorObject(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
    }

    const { email } = payload;
    if (!email) {
      throw buildErrorObject(httpStatus.BAD_REQUEST, 'Invalid token payload');
    }

    const application = await Career.findOne({ email });
    if (!application) {
      throw buildErrorObject(httpStatus.NOT_FOUND, 'Career application not found');
    }

    if (application.isVerified) {
      return res
        .status(httpStatus.OK)
        .json(buildResponse(httpStatus.OK, 'Application already verified'));
    }

    application.isVerified = true;
    await application.save();

    res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, 'Application email verified successfully'));
  } catch (err) {
    handleError(res, err);
  }
};

