const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcrypt')

const db =
  new sqlite3.Database('./database.sqlite')

db.serialize(() => {
  // =========================
  // USERS
  // =========================

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      first_login INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // =========================
  // DEFAULT USER
  // =========================

  db.get(
    `
  SELECT id
  FROM users
  WHERE username = ?
  `,
    ['academia_energiafitnessrn'],
    async (err, row) => {

      if (row) return

      const hash =
        await bcrypt.hash(
          'Energia@2026',
          10
        )

      db.run(
        `
      INSERT INTO users (
        username,
        password,
        first_login
      )
      VALUES (?, ?, 1)
      `,
        [
          'academia_energiafitnessrn',
          hash
        ]
      )

      console.log(
        'Usuário padrão criado'
      )
    }
  )

  // =========================
  // CLIENTS
  // =========================

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

  // =========================
  // PAYMENTS
  // =========================

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

      FOREIGN KEY(client_id)
      REFERENCES clients(id)
    )
  `)

  db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_unique
    ON payments (
      client_id,
      strftime('%Y-%m', due_date)
    )
  `)

  // =========================
  // MESSAGES
  // =========================

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

  // =========================
  // CHATBOT
  // =========================

  db.run(`
    CREATE TABLE IF NOT EXISTS chatbot_flows (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      name TEXT,

      trigger_words TEXT,

      timeout_minutes INTEGER DEFAULT 5,

      message TEXT,

      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS chatbot_nodes (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      flow_id INTEGER,

      parent_id INTEGER,

      option_key TEXT,

      title TEXT,

      message TEXT,

      created_at TEXT DEFAULT (datetime('now')),

      FOREIGN KEY(flow_id)
      REFERENCES chatbot_flows(id),

      FOREIGN KEY(parent_id)
      REFERENCES chatbot_nodes(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS chatbot_sessions (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      phone TEXT,

      flow_id INTEGER,

      current_node_id INTEGER,

      started INTEGER DEFAULT 1,

      last_interaction TEXT,

      created_at TEXT DEFAULT (datetime('now'))
    )
  `)

  // =========================
  // SEED MESSAGES
  // =========================

  const defaultMessages = [

    {
      type: 'before_2_days',
      content:
        `Olá {name} 👋

Sua mensalidade vence em 2 dias.

Caso já tenha realizado o pagamento, ignore esta mensagem.`
    },

    {
      type: 'before_1_day',
      content:
        `Olá {name} 👋

Sua mensalidade vence amanhã.

Evite atrasos realizando o pagamento antecipadamente.`
    },

    {
      type: 'due_today',
      content:
        `Olá {name} 👋

Sua mensalidade vence hoje.

Após o pagamento envie:
"Paguei"`
    },

    {
      type: 'after_1_day',
      content:
        `Olá {name} 👋

Identificamos uma mensalidade em atraso.

Caso já tenha realizado o pagamento envie:
"Paguei"`
    }
  ]

  defaultMessages.forEach(msg => {

    db.run(`
      INSERT OR IGNORE INTO messages
      (type, content)
      VALUES (?, ?)
    `, [
      msg.type,
      msg.content
    ])
  })

  // =========================
  // CREATE DEFAULT CLIENT
  // =========================

  db.get(`
    SELECT id
    FROM clients
    WHERE phone = '(84) 99999-9999'
  `,

    [],

    (err, row) => {

      if (row) return

      const yesterday = new Date()

      yesterday.setDate(
        yesterday.getDate() - 1
      )

      const dueDate =
        yesterday.toISOString()
          .split('T')[0]

      db.run(`
      INSERT INTO clients (

        name,
        cpf,
        phone,
        birth_date,
        payment_day,
        created_at

      )
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `,

        [
          'Leo Teste',
          '000.000.000-00',
          '(84) 99613-5117',
          '2000-01-01',
          yesterday.getDate()
        ],

        function () {

          const clientId =
            this.lastID

          db.run(`
        INSERT OR IGNORE INTO payments (

          client_id,
          due_date,
          paid

        )
        VALUES (?, ?, 0)
      `,

            [
              clientId,
              dueDate
            ])

          console.log(
            'Cliente padrão criado'
          )
        })
    })
})

module.exports = db