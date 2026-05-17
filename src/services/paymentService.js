const supabase =
  require('../config/supabase')

// CREATE
exports.createPayment =
  async (payment) => {

    const { client_id } = payment

    const today = new Date()

    const year =
      today.getFullYear()

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, '0')

    // CLIENTE
    const {
      data: client,
      error: clientError
    } =
      await supabase
        .from('clients')
        .select('payment_day')
        .eq('id', client_id)
        .single()

    if (clientError) {
      throw clientError
    }

    const due_date =
      `${year}-${month}-${String(
        client.payment_day
      ).padStart(2, '0')}`

    const {
      data,
      error
    } =
      await supabase
        .from('payments')
        .insert([
          {
            client_id,
            due_date
          }
        ])
        .select()
        .single()

    if (error) {
      throw error
    }

    return data
  }

// READ
exports.getPayments =
  async () => {

    const {
      data,
      error
    } =
      await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name
          )
        `)
        .order('id', {
          ascending: false
        })

    if (error) {
      throw error
    }

    return (data || []).map(
      payment => ({
        ...payment,
        name:
          payment.clients?.name
      })
    )
  }

// UPDATE
exports.updatePayment =
  async (id, payment) => {

    const {
      client_id,
      due_date
    } = payment

    const { error } =
      await supabase
        .from('payments')
        .update({
          client_id,
          due_date
        })
        .eq('id', id)

    if (error) {
      throw error
    }

    return true
  }

// DELETE
exports.deletePayment =
  async (id) => {

    const { error } =
      await supabase
        .from('payments')
        .delete()
        .eq('id', id)

    if (error) {
      throw error
    }

    return true
  }

// MARCAR COMO PAGO
exports.markAsPaid =
  async (id) => {

    const { error } =
      await supabase
        .from('payments')
        .update({
          paid: 1,
          paid_at:
            new Date()
              .toISOString()
        })
        .eq('id', id)

    if (error) {
      throw error
    }

    return true
  }

// PAGAMENTOS PENDENTES
exports.getPendingPayments =
  async () => {

    const {
      data,
      error
    } =
      await supabase
        .from('payments')
        .select(`
          *,
          clients (
            name,
            phone
          )
        `)
        .eq('paid', 0)

    if (error) {
      throw error
    }

    return (data || []).map(
      payment => ({
        ...payment,
        name:
          payment.clients?.name,
        phone:
          payment.clients?.phone
      })
    )
  }

// MARCAR MENSAGEM ENVIADA
exports.markMessageAsSent =
  async (id) => {

    const { error } =
      await supabase
        .from('payments')
        .update({
          message_sent: 1
        })
        .eq('id', id)

    if (error) {
      throw error
    }

    return true
  }

// GERAR PAGAMENTOS
exports.generateMonthlyPayments =
  async () => {

    const today = new Date()

    const year =
      today.getFullYear()

    const month =
      String(
        today.getMonth() + 1
      ).padStart(2, '0')

    const todayDay =
      today.getDate()

    const {
      data: clients,
      error
    } =
      await supabase
        .from('clients')
        .select('*')

    if (error) {
      throw error
    }

    for (const client of clients) {

      const paymentDay =
        client.payment_day

      const diff =
        paymentDay - todayDay

      if (
        diff === 5 ||
        diff < 0
      ) {

        const due_date =
          `${year}-${month}-${String(
            paymentDay
          ).padStart(2, '0')}`

        // verifica se já existe
        const {
          data: exists
        } =
          await supabase
            .from('payments')
            .select('id')
            .eq(
              'client_id',
              client.id
            )
            .eq(
              'due_date',
              due_date
            )
            .limit(1)

        if (
          exists &&
          exists.length > 0
        ) {
          continue
        }

        await supabase
          .from('payments')
          .insert([
            {
              client_id:
                client.id,
              due_date
            }
          ])
      }
    }

    return true
  }

// BUSCAR POR TELEFONE
exports.getPendingPaymentByPhone =
  async (phone) => {

    const {
      data,
      error
    } =
      await supabase
        .from('payments')
        .select(`
          *,
          clients (
            phone
          )
        `)
        .eq('paid', 0)
        .order('due_date', {
          ascending: true
        })

    if (error) {
      throw error
    }

    const payment =
      (data || []).find(
        item =>
          item.clients?.phone === phone
      )

    return payment || null
  }