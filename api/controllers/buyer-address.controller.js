import BuyerAddress from '../models/buyer-address.schema.js';
import buildResponse from '../utils/buildResponse.js';
import handleError from '../utils/handleError.js';
import httpStatus from 'http-status';
import { matchedData } from 'express-validator';

export const getBuyerAddressesController = async (req, res) => {
  try {
    const { addressType } = matchedData(req);
    const validatedData = matchedData(req);
    const page = (Number(validatedData?.page) || 1) ;
    const limit = Math.min(Number(validatedData?.limit) || 10, 50);
    const skip = (page - 1) * limit;
    
    let query = { buyerId: req.user._id };
    if (addressType) {
      query.addressType = addressType;
    }
    
    const [totalCount, addresses] = await Promise.all([
      BuyerAddress.countDocuments(query),
      BuyerAddress.find(query)
        .sort({ isDefault: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    const totalPages = Math.ceil(totalCount / limit);


    const response ={
        docs:addresses ,
        hasPrev:page>1 ,
        hasNext:page<totalPages ,
        totalPages:totalPages ,
    }
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, response));
  } catch (err) {
    handleError(res, err);
  }
};

export const getBuyerAddressByIdController = async (req, res) => {
  try {
    const { addressId } = matchedData(req);
    
    const address = await BuyerAddress.findById(addressId);
    
    if (!address) {
      return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Address not found'));
    }
    
    if (address.buyerId.toString() !== req.user._id.toString()) {
      return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to access this address'));
    }
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK,  address ));
  } catch (err) {
    handleError(res, err);
  }
};

export const addBuyerAddressController = async (req, res) => {
  try {
    const addressData = matchedData(req);
    
    addressData.buyerId = req.user._id;
    
    const existingAddressCount = await BuyerAddress.countDocuments({ 
      buyerId: req.user._id,
      addressType: addressData.addressType
    });
    
    if (existingAddressCount === 0) {
      addressData.isDefault = true;
    }
    
    const newAddress = await BuyerAddress.create(addressData);
    
    res.status(httpStatus.CREATED).json(buildResponse(httpStatus.CREATED, 
       newAddress
    ));
  } catch (err) {
    handleError(res, err);
  }
};

export const updateBuyerAddressController = async (req, res) => {
  try {
    const { addressId, ...updateData } = matchedData(req);
    
    const address = await BuyerAddress.findById(addressId);
    
    if (!address) {
      return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Address not found'));
    }
    
    if (address.buyerId.toString() !== req.user._id.toString()) {
      return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to update this address'));
    }
    
    Object.assign(address, updateData);
    await address.save();
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { 
      message: 'Address updated successfully',
      address
    }));
  } catch (err) {
    handleError(res, err);
  }
};

export const deleteBuyerAddressController = async (req, res) => {
  try {
    const { addressId } = matchedData(req);
    
    const address = await BuyerAddress.findById(addressId);
    
    if (!address) {
      return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Address not found'));
    }
    
    if (address.buyerId.toString() !== req.user._id.toString()) {
      return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to delete this address'));
    }
    
    if (address.isDefault) {
      const alternativeAddress = await BuyerAddress.findOne({
        buyerId: req.user._id,
        addressType: address.addressType,
        _id: { $ne: addressId }
      });
      
      if (alternativeAddress) {
        alternativeAddress.isDefault = true;
        await alternativeAddress.save();
      }
    }
    
    await address.deleteOne();
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Address deleted successfully'));
  } catch (err) {
    handleError(res, err);
  }
};

export const setDefaultAddressController = async (req, res) => {
  try {
    const { addressId } = matchedData(req);
    
    const address = await BuyerAddress.findById(addressId);
    
    if (!address) {
      return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, 'Address not found'));
    }
    
    if (address.buyerId.toString() !== req.user._id.toString()) {
      return res.status(httpStatus.FORBIDDEN).json(buildResponse(httpStatus.FORBIDDEN, 'You do not have permission to modify this address'));
    }
    
    if (address.isDefault) {
      return res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Address is already set as default'));
    }
    
    await BuyerAddress.updateMany(
      { 
        buyerId: req.user._id, 
        addressType: address.addressType,
        isDefault: true 
      },
      { isDefault: false }
    );
    
    address.isDefault = true;
    await address.save();
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, 'Address set as default successfully'));
  } catch (err) {
    handleError(res, err);
  }
};

export const getDefaultAddressController = async (req, res) => {
  try {
    const { addressType } = matchedData(req);
    
    if (!addressType) {
      return res.status(httpStatus.BAD_REQUEST).json(buildResponse(httpStatus.BAD_REQUEST, 'Address type is required'));
    }
    
    const defaultAddress = await BuyerAddress.findOne({
      buyerId: req.user._id,
      addressType,
      isDefault: true
    });
    
    if (!defaultAddress) {
      return res.status(httpStatus.NOT_FOUND).json(buildResponse(httpStatus.NOT_FOUND, `No default ${addressType} address found`));
    }
    
    res.status(httpStatus.OK).json(buildResponse(httpStatus.OK, { address: defaultAddress }));
  } catch (err) {
    handleError(res, err);
  }
};