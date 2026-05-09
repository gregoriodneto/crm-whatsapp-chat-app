const db = require('../db')

exports.getMessageByType = (type) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM messages WHERE type = ?`,
      [type],
      (err, row) => {
        if (err) return reject(err)
        resolve(row)
      }
    )
  })
}