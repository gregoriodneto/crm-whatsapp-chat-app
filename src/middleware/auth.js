const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')

const { SECRET } =
  require('../routes/auth')

function authMiddleware(req, res, next) {

  try {

    const authHeader =
      req.headers.authorization

    if (!authHeader) {

      return res.status(401).json({
        error: 'Token não informado'
      })
    }

    const token =
      authHeader.replace('Bearer ', '')

    const decoded =
      jwt.verify(token, SECRET)

    req.user = decoded

    next()

  } catch {

    return res.status(401).json({
      error: 'Token inválido'
    })
  }
}

module.exports = authMiddleware