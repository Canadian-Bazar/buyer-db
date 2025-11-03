import httpStatus from 'http-status'
import GlobalParagraph from '../models/global-paragraph.schema.js'
import buildResponse from '../utils/buildResponse.js'
import buildErrorObject from '../utils/buildErrorObject.js'
import handleError from '../utils/handleError.js'

// GET /api/v1/global-paragraph?path=/some/path
// Public endpoint - no authentication needed
export const getGlobalParagraphController = async (req, res) => {
  try {
    const pathParam = (req.query.path || '/').toString().trim().toLowerCase()

    if (!pathParam) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'PATH_REQUIRED'))
    }

    const paragraph = await GlobalParagraph.findOne({ path: pathParam, isActive: true })
    const content = paragraph?.content || ''

    return res.status(httpStatus.OK).json(
      buildResponse(httpStatus.OK, { path: pathParam, content }),
    )
  } catch (error) {
    handleError(res, error)
  }
}

