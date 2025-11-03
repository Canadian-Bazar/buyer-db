import httpStatus from 'http-status';
import buildResponse from '../utils/buildResponse.js';
import buildErrorObject from '../utils/buildErrorObject.js';
import handleError from '../utils/handleError.js';
import SeoSettings from '../models/seo-settings.schema.js';

// GET /api/v1/seo/by-path?path=/some/path
export const getSeoHeadController = async (req, res) => {
  try {
    let pathParam = (req.query.path || '/').toString().trim().toLowerCase();

    // Normalize path: ensure leading slash, collapse duplicate slashes,
    // and ensure a trailing slash for non-root paths to match DB storage
    if (!pathParam.startsWith('/')) pathParam = '/' + pathParam;
    pathParam = pathParam.replace(/\/{2,}/g, '/');
    if (pathParam.length > 1 && !pathParam.endsWith('/')) {
      pathParam = pathParam + '/';
    }

    if (!pathParam) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json(buildErrorObject(httpStatus.BAD_REQUEST, 'PATH_REQUIRED'));
    }

    const seo = await SeoSettings.findOne({ path: pathParam });
    const code = seo?.code || '';

    return res
      .status(httpStatus.OK)
      .json(buildResponse(httpStatus.OK, { path: pathParam, code }));
  } catch (error) {
    handleError(res, error);
  }
};
