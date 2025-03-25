const buildErrorObject = (code, message) => {
  return { success: false, code, message }
}

export default buildErrorObject
