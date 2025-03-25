const handleError = (res, err) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(err)
  }

  const response = {
    success: false,
    code: 500,
    message: 'SOMETHING_WENT_WRONG',
  }
  if (err?.message) {
    response.message = err.message
  }

  if (err?.code <= 500) {
    response.code = err.code
  }

  res.status(response.code).json(response)
}

export default handleError
