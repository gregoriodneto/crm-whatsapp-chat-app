const supabase =
  require('../config/supabase')

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

async function getFlow() {

  const { data, error } =
    await supabase
      .from('chatbot_flows')
      .select('*')
      .limit(1)
      .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}

async function getRootNodes(flowId) {

  const { data, error } =
    await supabase
      .from('chatbot_nodes')
      .select('*')
      .eq('flow_id', flowId)
      .is('parent_id', null)
      .order('option_key')

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

async function getChildren(parentId) {

  const { data, error } =
    await supabase
      .from('chatbot_nodes')
      .select('*')
      .eq('parent_id', parentId)
      .order('option_key')

  if (error) {
    console.error(error)
    return []
  }

  return data || []
}

async function getNodeByOption(
  flowId,
  parentId,
  option
) {

  let query =
    supabase
      .from('chatbot_nodes')
      .select('*')
      .eq('flow_id', flowId)
      .eq('option_key', option)

  if (parentId === null) {

    query =
      query.is('parent_id', null)

  } else {

    query =
      query.eq('parent_id', parentId)
  }

  const { data, error } =
    await query.single()

  if (error) {
    return null
  }

  return data
}

async function buildMenu(nodes) {

  let text =
    'Escolha uma opção:\n\n'

  for (const node of nodes) {

    text +=
      `${node.option_key} - ${node.title}\n`
  }

  return text
}

async function startSession(
  phone,
  sock,
  jid
) {

  const flow = await getFlow()

  if (!flow) return

  const roots =
    await getRootNodes(flow.id)

  sessions.set(phone, {
    flowId: flow.id,
    currentNodeId: null,
    lastInteraction: Date.now()
  })

  const menu =
    await buildMenu(roots)

  await sock.sendMessage(jid, {
    text:
`Olá 👋

${menu}`
  })
}

async function processOption(
  phone,
  option,
  sock,
  jid
) {

  const session =
    sessions.get(phone)

  if (!session) {
    return
  }

  const node =
    await getNodeByOption(
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

  session.lastInteraction =
    Date.now()

  const children =
    await getChildren(node.id)

  if (children.length === 0) {

    await sock.sendMessage(jid, {
      text:
        node.message ||
        'Sem conteúdo.'
    })

    return
  }

  session.currentNodeId =
    node.id

  let text =
    `${node.message || ''}\n\n`

  for (const child of children) {

    text +=
      `${child.option_key} - ${child.title}\n`
  }

  await sock.sendMessage(jid, {
    text
  })
}

async function handleIncomingMessage(
  phone,
  text,
  sock,
  jid
) {

  const normalized =
    normalize(text)

  if (isTrigger(normalized)) {

    await startSession(
      phone,
      sock,
      jid
    )

    return
  }

  const session =
    sessions.get(phone)

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

  for (
    const [phone, session]
    of sessions.entries()
  ) {

    const diffMinutes =
      (now - session.lastInteraction)
      / 1000 / 60

    if (diffMinutes >= 5) {

      const jid =
        '55' +
        phone
          .replace(/\D/g, '')
          .replace(/^55/, '')
          .replace(
            /^(\d{2})(\d{8})$/,
            '$19$2'
          )
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