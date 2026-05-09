const express = require('express')
const crypto = require('crypto')

const router = express.Router()

const PASSWORD = 'oDmKhux4XTLKRpKfgcv9'

let sessions = []

router.post('/login', (req, res) => {
  const { password } = req.body

  if (password !== PASSWORD) {
    return res.status(401).json({
      error: 'Senha inválida'
    })
  }

  const token = crypto.randomBytes(48).toString('hex')

  sessions.push(token)

  res.json({
    token
  })
})

router.get('/validate', (req, res) => {
  const auth = req.headers.authorization

  if (!auth) {
    return res.status(401).json({
      valid: false
    })
  }

  const token = auth.replace('Bearer ', '')

  if (!sessions.includes(token)) {
    return res.status(401).json({
      valid: false
    })
  }

  res.json({
    valid: true
  })
})

module.exports = {
  router,
  sessions
}