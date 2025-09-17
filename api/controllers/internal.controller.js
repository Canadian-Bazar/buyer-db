import bcrypt from 'bcrypt'
import httpStatus from 'http-status'
import { nanoid } from 'nanoid'

import Roles from '../models/role.schema.js'
import Buyer from '../models/buyer.schema.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import buildResponse from '../utils/buildResponse.js'

export const createBuyerInternalController = async (req, res) => {
  try {
    const {
      fullName,
      companyName,
      email,
      phoneNumber,
      phone,
      password,
      passwordHash,
      city,
      state,
    } = req.body || {}

    const resolvedFullName = fullName || companyName || 'New Seller'
    const resolvedPhone = phoneNumber || phone
    if (!resolvedFullName || !resolvedPhone || (!password && !passwordHash)) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'Missing required fields'))
    }

    const existing = await Buyer.findOne({
      $or: [{ phoneNumber: resolvedPhone }, ...(email ? [{ email }] : [])],
    }).lean()
    if (existing?._id) {
      return res
        .status(httpStatus.OK)
        .json(buildResponse(httpStatus.OK, { message: 'Buyer already exists' }))
    }

    let passwordToSave = passwordHash
    if (!passwordToSave) {
      passwordToSave = await bcrypt.hash(password, 10)
    }

    // Ensure unique memberId
    let memberId
    // Try a few times to avoid extremely rare collisions
    // Fall back to using phoneNumber if still colliding
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = nanoid()
      // eslint-disable-next-line no-await-in-loop
      const exists = await Buyer.findOne({ memberId: candidate }).lean()
      if (!exists) {
        memberId = candidate
        break
      }
    }
    if (!memberId) {
      memberId = `${resolvedPhone}-${Date.now()}`
    }

    const buyerRole = await Roles.findOne({ role: 'buyer' }).lean()
    if (!buyerRole) {
      throw buildErrorObject(
        httpStatus.INTERNAL_SERVER_ERROR,
        'Unable to assign user role. Please try again later.',
      )
    }

    await Buyer.create({
      fullName: resolvedFullName,
      email: email || undefined,
      phoneNumber: resolvedPhone,
      password: passwordToSave,
      roleId: buyerRole._id,
      city: city || 'NA',
      state: state || 'NA',
      memberId,
    })

    return res
      .status(httpStatus.CREATED)
      .json(buildResponse(httpStatus.CREATED, { message: 'Buyer created' }))
  } catch (err) {
    return res.status(err?.status || 500).json(buildErrorObject(err?.status || 500, err?.message || 'INTERNAL_ERROR'))
  }
}


