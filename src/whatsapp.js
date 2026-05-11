const makeWASocket = require('@whiskeysockets/baileys').default
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')

const paymentService = require('./services/paymentService')

let qrCodeImage = null
let sockGlobal = null

function clearAuthFolder() {
  const authPath = path.join(__dirname, '..', 'auth_info_baileys')

  if (fs.existsSync(authPath)) {
    fs.rmSync(authPath, { recursive: true, force: true })
    console.log('Sessão removida (auth_info_baileys)')
  }
}

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    auth: state,
    version,
    browser: ['Windows', 'Chrome', '120.0.0']
  })

  sockGlobal = sock

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('messages.upsert', async ({ messages }) => {

    const msg = messages[0]

    if (!msg.message) return
    if (msg.key.fromMe) return

    const remoteJid = msg.key.senderPn

    if (!remoteJid.includes('@s.whatsapp.net')) {
      return
    }

    // pega telefone
    let phone = remoteJid
      .replace('@s.whatsapp.net', '')
      .replace('55', '')

    // adiciona 9 novamente para bater com banco
    if (phone.length === 10) {
      phone =
        phone.slice(0, 2) +
        '9' +
        phone.slice(2)
    }

    phone = phone.replace(
      /^(\d{2})(\d{5})(\d{4})$/,
      '($1) $2-$3'
    )

    console.log(phone)

    // pega texto
    const text =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      ''

    const normalized = text
      .trim()
      .toLowerCase()

    console.log('Mensagem recebida:', normalized)

    // palavras aceitas
    const paidWords = [
      'pago',
      'pago!',
      'paguei',
      'paguei!'
    ]

    if (!paidWords.includes(normalized)) {
      return
    }

    try {

      const payment =
        await paymentService.getPendingPaymentByPhone(phone)

      if (!payment) {

        await sock.sendMessage(remoteJid, {
          text: 'Nenhuma mensalidade pendente encontrada.'
        })

        return
      }

      await paymentService.markAsPaid(payment.id)

      await sock.sendMessage(remoteJid, {
        text: 'Pagamento confirmado com sucesso'
      })

      console.log('Pagamento marcado como pago:', payment.id)

    } catch (err) {
      console.error(err)
    }
  })

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      try {
        qrCodeImage = await qrcode.toDataURL(qr)
        console.log('QR Code gerado')
      } catch (err) {
        console.error('Erro QR:', err)
      }
    }

    if (connection === 'open') {
      console.log('Conectado')
      qrCodeImage = null
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode

      console.log('Conexão fechada:', statusCode)

      // CASO 401 (LOGOUT)
      if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
        console.log('Sessão expirada. Limpando e reconectando...')

        clearAuthFolder()

        setTimeout(() => {
          connectToWhatsApp()
        }, 3000)

        return
      }

      // OUTROS ERROS → reconectar normal
      console.log('Tentando reconectar...')
      setTimeout(() => {
        connectToWhatsApp()
      }, 5000)
    }
  })
}

function getQrCodeImage() {
  return qrCodeImage
}

async function sendMessage(phone, text) {
  if (!sockGlobal) throw new Error('WhatsApp não conectado')

  // remove tudo que não é número
  let clean = phone.replace(/\D/g, '')

  // adiciona 55 se não tiver
  if (!clean.startsWith('55')) {
    clean = '55' + clean
  }

  if (clean.length === 13) {
    clean =
      clean.slice(0, 4) +
      clean.slice(5)
  }

  const jid = clean + '@s.whatsapp.net'

  await sockGlobal.sendMessage(jid, { text })
}

module.exports = {
  connectToWhatsApp,
  getQrCodeImage,
  sendMessage
}