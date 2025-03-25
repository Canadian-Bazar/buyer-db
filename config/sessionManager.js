const sessionManager = (req, _res, next) => {
  req.session.clientIP = req.ip
  req.session.clientBrowser = req.get('user-agent')

  next()
}

export default sessionManager
