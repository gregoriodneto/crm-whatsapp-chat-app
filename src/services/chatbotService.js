const db = require('../db')

const sessions = new Map()

function normalize(text = '') {
  return text
    .trim()
    .toLowerCase()
}

function isTrigger(text) {

  const triggers = [
    'oi',
    'oi!',
    'duvida',
    'duvida!',
    'dúvida',
    'dúvida!',
    'menu',
    'ajuda'
  ]

  return triggers.includes(normalize(text))
}

function getFlow() {
  return new Promise((resolve, reject) => {

    db.get(
      `SELECT * FROM chatbot_flows LIMIT 1`,
      [],
      (err, row) => {

        if (err) return reject(err)

        resolve(row)
      }
    )
  })
}

function getRootNodes(flowId) {
  return new Promise((resolve, reject) => {

    db.all(
      `
      SELECT *
      FROM chatbot_nodes
      WHERE flow_id = ?
      AND parent_id IS NULL
      ORDER BY option_key
      `,
      [flowId],
      (err, rows) => {

        if (err) return reject(err)

        resolve(rows)
      }
    )
  })
}

function getChildren(parentId) {
  return new Promise((resolve, reject) => {

    db.all(
      `
      SELECT *
      FROM chatbot_nodes
      WHERE parent_id = ?
      ORDER BY option_key
      `,
      [parentId],
      (err, rows) => {

        if (err) return reject(err)

        resolve(rows)
      }
    )
  })
}

function getNodeByOption(flowId, parentId, option) {

  return new Promise((resolve, reject) => {

    let sql = `
      SELECT *
      FROM chatbot_nodes
      WHERE flow_id = ?
      AND option_key = ?
    `

    const params = [flowId, option]

    if (parentId === null) {
      sql += ` AND parent_id IS NULL`
    } else {
      sql += ` AND parent_id = ?`
      params.push(parentId)
    }

    db.get(sql, params, (err, row) => {

      if (err) return reject(err)

      resolve(row)
    })
  })
}

async function buildMenu(nodes) {

  let text = 'Escolha uma opção:\n\n'

  for (const node of nodes) {
    text += `${node.option_key} - ${node.title}\n`
  }

  return text
}

async function startSession(phone, sock, jid) {

  const flow = await getFlow()

  if (!flow) return

  const roots = await getRootNodes(flow.id)

  sessions.set(phone, {
    flowId: flow.id,
    currentNodeId: null,
    lastInteraction: Date.now()
  })

  const menu = await buildMenu(roots)

  await sock.sendMessage(jid, {
    text:
`Olá 👋

${menu}`
  })
}

async function processOption(phone, option, sock, jid) {

  const session = sessions.get(phone)

  if (!session) {
    return
  }

  const node = await getNodeByOption(
    session.flowId,
    session.currentNodeId,
    option
  )

  if (!node) {

    await sock.sendMessage(jid, {
      text: 'Opção inválida.'
    })

    return
  }

  session.lastInteraction = Date.now()

  const children = await getChildren(node.id)

  if (children.length === 0) {

    await sock.sendMessage(jid, {
      text: node.message || 'Sem conteúdo.'
    })

    return
  }

  session.currentNodeId = node.id

  let text = `${node.message || ''}\n\n`

  for (const child of children) {
    text += `${child.option_key} - ${child.title}\n`
  }

  await sock.sendMessage(jid, {
    text
  })
}

async function handleIncomingMessage(phone, text, sock, jid) {

  const normalized = normalize(text)

  if (isTrigger(normalized)) {

    await startSession(phone, sock, jid)

    return
  }

  const session = sessions.get(phone)

  if (!session) {
    return
  }

  await processOption(
    phone,
    normalized,
    sock,
    jid
  )
}

async function checkTimeouts(sock) {

  const now = Date.now()

  for (const [phone, session] of sessions.entries()) {

    const diffMinutes =
      (now - session.lastInteraction) / 1000 / 60

    if (diffMinutes >= 5) {

      const jid =
        '55' +
        phone.replace(/\D/g, '')
          .replace(/^55/, '')
          .replace(/^(\d{2})(\d{8})$/, '$19$2')
        +
        '@s.whatsapp.net'

      await sock.sendMessage(jid, {
        text:
`Atendimento encerrado por inatividade.

Envie "oi" para iniciar novamente.`
      })

      sessions.delete(phone)
    }
  }
}

module.exports = {
  handleIncomingMessage,
  checkTimeouts
}