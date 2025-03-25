const buildResponse = (code, response = {}) => {
  return { success: true, code, response }
}

export default buildResponse
