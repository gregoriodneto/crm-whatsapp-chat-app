const db = require('../db')

// CREATE
exports.createPayment = (payment) => {
  return new Promise((resolve, reject) => {
    const { client_id } = payment

    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')

    db.get(
      `SELECT payment_day FROM clients WHERE id = ?`,
      [client_id],
      (err, client) => {
        if (err) return reject(err)

        const due_date = `${year}-${month}-${String(client.payment_day).padStart(2, '0')}`

        db.run(
          `INSERT INTO payments (client_id, due_date, created_at)
           VALUES (?, ?, datetime('now'))`,
          [client_id, due_date],
          function (err) {
            if (err) return reject(err)
            resolve({ id: this.lastID })
          }
        )
      }
    )
  })
}
// READ
exports.getPayments = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, c.name 
       FROM payments p
       JOIN clients c ON c.id = p.client_id`,
      [],
      (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      }
    )
  })
}

// UPDATE
exports.updatePayment = (id, data) => {
  return new Promise((resolve, reject) => {
    const { client_id, month, due_date } = data

    db.run(
      `UPDATE payments 
       SET client_id = ?, month = ?, due_date = ?
       WHERE id = ?`,
      [client_id, month, due_date, id],
      function (err) {
        if (err) return reject(err)
        resolve(true)
      }
    )
  })
}

// DELETE
exports.deletePayment = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM payments WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err)
        resolve(true)
      }
    )
  })
}

// MARCAR COMO PAGO
exports.markAsPaid = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE payments 
       SET paid = 1, paid_at = datetime('now') 
       WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err)
        resolve(true)
      }
    )
  })
}

// BUSCAR PAGAMENTOS PENDENTES
exports.getPendingPayments = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT p.*, c.name, c.phone
       FROM payments p
       JOIN clients c ON c.id = p.client_id
       WHERE p.paid = 0`,
      [],
      (err, rows) => {
        if (err) return reject(err)
        resolve(rows)
      }
    )
  })
}

exports.markMessageAsSent = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE payments 
       SET message_sent = 1
       WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err)
        resolve(true)
      }
    )
  })
}

exports.generateMonthlyPayments = () => {
  return new Promise((resolve, reject) => {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const todayDay = today.getDate()

    db.all(`SELECT * FROM clients`, [], (err, clients) => {
      if (err) return reject(err)

      clients.forEach(client => {
        const paymentDay = client.payment_day

        // diferença de dias
        const diff = paymentDay - todayDay

        // ✔ cria 5 dias antes OU se já passou (atrasado)
        if (diff === 5 || diff < 0) {

          const due_date = `${year}-${month}-${String(paymentDay).padStart(2, '0')}`

          db.run(
            `INSERT OR IGNORE INTO payments (client_id, due_date)
             VALUES (?, ?)`,
            [client.id, due_date]
          )
        }
      })

      resolve(true)
    })
  })
}