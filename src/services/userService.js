const db = require('../db')

function findByUsername(username) {

  return new Promise((resolve, reject) => {

    db.get(
      `
      SELECT *
      FROM users
      WHERE username = ?
      `,
      [username],
      (err, row) => {

        if (err) {
          return reject(err)
        }

        resolve(row)
      }
    )
  })
}

function updatePassword(userId, password) {

  return new Promise((resolve, reject) => {

    db.run(
      `
      UPDATE users
      SET password = ?
      WHERE id = ?
      `,
      [password, userId],
      function(err) {

        if (err) {
          return reject(err)
        }

        resolve(true)
      }
    )
  })
}

function disableFirstLogin(userId) {

  return new Promise((resolve, reject) => {

    db.run(
      `
      UPDATE users
      SET first_login = 0
      WHERE id = ?
      `,
      [userId],
      function(err) {

        if (err) {
          return reject(err)
        }

        resolve(true)
      }
    )
  })
}

module.exports = {
  findByUsername,
  updatePassword,
  disableFirstLogin
}