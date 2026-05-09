const { sessions } = require('../routes/auth')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({
      error: 'Token não informado'
    })
  }

  const token = authHeader.replace('Bearer ', '')

  if (!sessions.includes(token)) {
    return res.status(401).json({
      error: 'Token inválido'
    })
  }

  next()
}

module.exports = authMiddleware