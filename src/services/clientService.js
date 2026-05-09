const db = require('../db')

exports.createClient = (client) => {
  return new Promise((resolve, reject) => {
    const { name, cpf, phone, birth_date, payment_day } = client

    db.run(
      `INSERT INTO clients (name, cpf, phone, birth_date, payment_day, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [name, cpf, phone, birth_date, payment_day],
      function (err) {
        if (err) return reject(err)
        resolve({ id: this.lastID })
      }
    )
  })
}

exports.getClients = () => {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM clients`, [], (err, rows) => {
      if (err) return reject(err)
      resolve(rows)
    })
  })
}

exports.updateClient = (id, client) => {
  return new Promise((resolve, reject) => {
    const { name, cpf, phone, birth_date, payment_day } = client

    db.run(
      `UPDATE clients 
       SET name = ?, cpf = ?, phone = ?, birth_date = ?, payment_day = ?
       WHERE id = ?`,
      [name, cpf, phone, birth_date, payment_day, id],
      function (err) {
        if (err) return reject(err)
        resolve(true)
      }
    )
  })
}

exports.deleteClient = (id) => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM clients WHERE id = ?`,
      [id],
      function (err) {
        if (err) return reject(err)
        resolve(true)
      }
    )
  })
}