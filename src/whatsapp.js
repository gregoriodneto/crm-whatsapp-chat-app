const makeWASocket = require('@whiskeysockets/baileys').default
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
const qrcode = require('qrcode')
const fs = require('fs')
const path = require('path')

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

  const jid = clean + '@s.whatsapp.net'

  await sockGlobal.sendMessage(jid, { text })
}

module.exports = {
  connectToWhatsApp,
  getQrCodeImage,
  sendMessage
}