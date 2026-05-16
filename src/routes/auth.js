const express = require('express')
const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const usersService =
  require('../services/userService')

const router = express.Router()

const SECRET =
  'Js6sPau4lA24yBTpFWyanDjDMhybuTPnnzvc5vJxL6s'

router.post('/login', async (req, res) => {

  try {

    const { username, password } = req.body

    const user =
      await usersService.findByUsername(username)

    if (!user) {

      return res.status(401).json({
        error: 'Usuário inválido'
      })
    }

    const valid =
      await bcrypt.compare(
        password,
        user.password
      )

    if (!valid) {

      return res.status(401).json({
        error: 'Senha inválida'
      })
    }

    // =========================
    // PRIMEIRO LOGIN
    // =========================

    if (user.first_login) {

      const tempToken = jwt.sign(
        {
          userId: user.id,
          firstLogin: true
        },
        SECRET,
        {
          expiresIn: '15m'
        }
      )

      return res.json({
        firstLogin: true,
        tempToken
      })
    }

    // =========================
    // LOGIN NORMAL
    // =========================

    const token = jwt.sign(
      {
        userId: user.id
      },
      SECRET,
      {
        expiresIn: '7d'
      }
    )

    res.json({
      token
    })

  } catch (err) {

    console.error(err)

    res.status(500).json({
      error: 'Erro interno'
    })
  }
})

router.post('/first-password', async (req, res) => {

  try {

    const {
      tempToken,
      currentPassword,
      password
    } = req.body

    const decoded =
      jwt.verify(tempToken, SECRET)

    if (!decoded.firstLogin) {

      return res.status(401).json({
        error: 'Token inválido'
      })
    }

    const user =
      await usersService.findByUsername(
        decoded.username
      )

    const hash =
      await bcrypt.hash(password, 10)

    await usersService.updatePassword(
      decoded.userId,
      hash
    )

    await usersService.disableFirstLogin(
      decoded.userId
    )

    const token = jwt.sign(
      {
        userId: decoded.userId
      },
      SECRET,
      {
        expiresIn: '7d'
      }
    )

    res.json({
      token
    })

  } catch (err) {

    console.error(err)

    res.status(401).json({
      error: 'Token inválido'
    })
  }
})

router.get('/validate', (req, res) => {

  try {

    const auth =
      req.headers.authorization

    if (!auth) {

      return res.status(401).json({
        valid: false
      })
    }

    const token =
      auth.replace('Bearer ', '')

    jwt.verify(token, SECRET)

    res.json({
      valid: true
    })

  } catch {

    res.status(401).json({
      valid: false
    })
  }
})

module.exports = {
  router,
  SECRET
}