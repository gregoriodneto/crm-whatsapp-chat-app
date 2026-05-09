const express = require('express')
const router = express.Router()

const db = require('../db')

// CREATE
router.post('/', (req, res) => {
  const { type, content } = req.body

  db.run(
    `INSERT INTO messages (type, content) VALUES (?, ?)`,
    [type, content],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ id: this.lastID })
    }
  )
})

// READ
router.get('/', (req, res) => {
  db.all(`SELECT * FROM messages`, [], (err, rows) => {
    if (err) return res.status(500).json(err)
    res.json(rows)
  })
})

// UPDATE
router.put('/:id', (req, res) => {
  const { type, content } = req.body

  db.run(
    `UPDATE messages SET type = ?, content = ? WHERE id = ?`,
    [type, content, req.params.id],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ success: true })
    }
  )
})

// DELETE
router.delete('/:id', (req, res) => {
  db.run(
    `DELETE FROM messages WHERE id = ?`,
    [req.params.id],
    function (err) {
      if (err) return res.status(500).json(err)
      res.json({ success: true })
    }
  )
})

module.exports = router