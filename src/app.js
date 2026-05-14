const express = require('express')
const app = express()

const authMiddleware = require('./middleware/auth')

const authRoutes = require('./routes/auth')

const clientsRoutes = require('./routes/clients')
const paymentsRoutes = require('./routes/payments')
const messagesRoutes = require('./routes/messages')
const chatbotRoutes = require('./routes/chatbot')

const { connectToWhatsApp } = require('./whatsapp')
require('./scheduler')

app.use(express.json())

app.use('/auth', authRoutes.router)

app.use('/clients', authMiddleware, clientsRoutes)
app.use('/payments', authMiddleware, paymentsRoutes)
app.use('/messages', authMiddleware, messagesRoutes)
app.use('/chatbot', authMiddleware, chatbotRoutes)

app.listen(3000, async () => {
  console.log('Servidor rodando na porta 3000')

  await connectToWhatsApp()
})

app.use(express.static('public'))

app.get('/qr-code', authMiddleware, (req, res) => {
  const { getQrCodeImage } = require('./whatsapp')

  const qr = getQrCodeImage()

  res.json({
    connected: !qr,
    qr
  })
})