const express = require('express')
const router = express.Router()

const {
  createClient,
  getClients,
  updateClient,
  deleteClient
} = require('../services/clientService')

router.post('/', async (req, res) => {
  const client = await createClient(req.body)
  res.json(client)
})

router.get('/', async (req, res) => {
  const clients = await getClients()
  res.json(clients)
})

router.put('/:id', async (req, res) => {
  await updateClient(req.params.id, req.body)
  res.json({ success: true })
})

router.delete('/:id', async (req, res) => {
  await deleteClient(req.params.id)
  res.json({ success: true })
})

module.exports = router