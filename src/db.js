const sqlite3 = require('sqlite3').verbose()

const db = new sqlite3.Database('./database.sqlite')

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      cpf TEXT,
      phone TEXT,
      birth_date TEXT,
      payment_day INTEGER,
      created_at TEXT
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      due_date TEXT,
      paid INTEGER DEFAULT 0,
      paid_at TEXT,
      message_sent INTEGER DEFAULT 0,
      message_sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY(client_id) REFERENCES clients(id)
    )
  `)

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_unique
    ON payments (client_id, strftime('%Y-%m', due_date));
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      content TEXT
    )
  `)

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_type
    ON messages(type)
  `)
})

module.exports = db