const cron = require('node-cron')
const { differenceInDays } = require('date-fns')

const { getPendingPayments, markMessageAsSent, generateMonthlyPayments } = require('./services/paymentService')
const { getMessageByType } = require('./services/messageService')
const { sendMessage } = require('./whatsapp')

const {
  isWeekend,
  isHoliday,
  isBusinessHour
} = require('./utils/dateUtils')

function parseDateLocal(dateStr) {
  const [year, month, day] = dateStr.split('-')
  return new Date(year, month - 1, day)
}

// roda a cada 5 minutos
cron.schedule('*/1 * * * *', async () => {
  const now = new Date()

  if (!isBusinessHour()) return
  if (isWeekend(now)) return
  if (isHoliday(now)) return

  console.log('Rodando scheduler...')

  await generateMonthlyPayments()

  const payments = await getPendingPayments()

  for (const p of payments) {
    // evita envio duplicado
    if (p.message_sent) continue

    const due = parseDateLocal(p.due_date)

    const today = new Date()
    today.setHours(0,0,0,0)

    const diff = differenceInDays(due, today)

    let type = null

    if (diff === 2) type = 'before_2_days'
    if (diff === 1) type = 'before_1_day'
    if (diff === 0) type = 'due_today'
    if (diff === -1) type = 'after_1_day'

    if (!type) continue

    const msgTemplate = await getMessageByType(type)

    if (!msgTemplate) {
      console.log(`Mensagem não cadastrada para tipo: ${type}`)
      continue
    }

    // substituição dinâmica
    let message = msgTemplate.content
      .replace('{name}', p.name)

    try {
      await sendMessage(p.phone, message)

      // marca como enviado
      await markMessageAsSent(p.id)

      console.log(`Mensagem enviada para ${p.name}`)
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err)
    }
  }
})