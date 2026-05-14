const express = require('express')
const router = express.Router()

const db = require('../db')

router.post('/flow', (req, res) => {

  const {
    name,
    trigger_words,
    timeout_minutes
  } = req.body

  db.run(
    `
    INSERT INTO chatbot_flows
    (name, trigger_words, timeout_minutes)
    VALUES (?, ?, ?)
    `,
    [
      name,
      trigger_words,
      timeout_minutes
    ],
    function(err) {

      if (err) {
        return res.status(500).json(err)
      }

      res.json({
        id: this.lastID
      })
    }
  )
})

router.get('/flows', (req, res) => {

  db.all(
    `SELECT * FROM chatbot_flows`,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json(err)
      }

      res.json(rows)
    }
  )
})

router.post('/node', (req, res) => {

  const {
    flow_id,
    parent_id,
    option_key,
    title,
    message
  } = req.body

  db.run(
    `
    INSERT INTO chatbot_nodes
    (
      flow_id,
      parent_id,
      option_key,
      title,
      message
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    [
      flow_id,
      parent_id || null,
      option_key,
      title,
      message
    ],
    function(err) {

      if (err) {
        return res.status(500).json(err)
      }

      res.json({
        id: this.lastID
      })
    }
  )
})

router.get('/nodes', (req, res) => {

  db.all(
    `
    SELECT *
    FROM chatbot_nodes
    ORDER BY parent_id, option_key
    `,
    [],
    (err, rows) => {

      if (err) {
        return res.status(500).json(err)
      }

      res.json(rows)
    }
  )
})

module.exports = router