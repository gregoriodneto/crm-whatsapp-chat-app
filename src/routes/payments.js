const express = require('express')
const router = express.Router()

const {
  createPayment,
  markAsPaid,
  getPayments,
  updatePayment,
  deletePayment
} = require('../services/paymentService')

// CREATE
router.post('/', async (req, res) => {
  const payment = await createPayment(req.body)
  res.json(payment)
})

// READ
router.get('/', async (req, res) => {
  const payments = await getPayments()
  res.json(payments)
})

// UPDATE
router.put('/:id', async (req, res) => {
  await updatePayment(req.params.id, req.body)
  res.json({ success: true })
})

// DELETE
router.delete('/:id', async (req, res) => {
  await deletePayment(req.params.id)
  res.json({ success: true })
})

// MARCAR COMO PAGO
router.post('/:id/pay', async (req, res) => {
  await markAsPaid(req.params.id)
  res.json({ success: true })
})

module.exports = router