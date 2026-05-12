const express = require('express')
const pool = require('../config/db')
const { verifyToken, verifyOwner } = require('../middleware/auth')

const router = express.Router()

router.get('/inventory', verifyToken, verifyOwner, async (req, res) => {
  const { from, to } = req.query
  try {
    let query = 'SELECT * FROM inventory_log WHERE 1=1'
    const params = []
    if (from) {
      params.push(from)
      query += ` AND performed_at >= $${params.length}`
    }
    if (to) {
      params.push(to + 'T23:59:59')
      query += ` AND performed_at <= $${params.length}`
    }
    query += ' ORDER BY performed_at DESC'
    const result = await pool.query(query, params)
    console.log(`[audit/inventory] returned ${result.rows.length} rows`)
    res.json(result.rows)
  } catch (err) {
    console.error('[audit/inventory] error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

router.get('/sales', verifyToken, verifyOwner, async (req, res) => {
  const { from, to } = req.query
  try {
    let query = `
      SELECT o.order_id, o.invoice_type, o.total_amount, o.tax, o.discount, o.created_at,
             o.invoice_number,
             u.name AS worker_name, c.name AS customer_name,
             CASE
               WHEN COALESCE((SELECT SUM(ri.quantity) FROM returns rr JOIN return_items ri ON ri.return_id = rr.return_id WHERE rr.order_id = o.order_id), 0) = 0 THEN 'none'
               WHEN COALESCE((SELECT SUM(ri.quantity) FROM returns rr JOIN return_items ri ON ri.return_id = rr.return_id WHERE rr.order_id = o.order_id), 0)
                 >= COALESCE((SELECT SUM(oi2.quantity) FROM order_items oi2 WHERE oi2.order_id = o.order_id), 0) THEN 'full'
               ELSE 'partial'
             END AS returns_status
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      WHERE 1=1`
    const params = []
    if (from) {
      params.push(from)
      query += ` AND o.created_at >= $${params.length}`
    }
    if (to) {
      params.push(to + 'T23:59:59')
      query += ` AND o.created_at <= $${params.length}`
    }
    query += ' ORDER BY o.created_at DESC'
    const result = await pool.query(query, params)
    console.log(`[audit/sales] returned ${result.rows.length} rows`)
    res.json(result.rows)
  } catch (err) {
    console.error('[audit/sales] error:', err.message, err.stack)
    res.status(500).json({ message: err.message })
  }
})

router.get('/returns', verifyToken, verifyOwner, async (req, res) => {
  const { from, to } = req.query
  try {
    let query = `
      SELECT
        r.return_id, r.order_id, r.return_date,
        u.name AS approver_name,
        c.name AS customer_name,
        seller.name AS worker_name,
        o.discount,
        o.invoice_number,
        SUM(ri.quantity) AS quantity,
        SUM(
          ri.quantity
          * COALESCE(oi.unit_price, 0)
          * (1 - COALESCE(o.discount, 0)::numeric / 100)
          * (1 + CASE WHEN (o.total_amount - o.tax) > 0 THEN o.tax::numeric / (o.total_amount - o.tax) ELSE 0 END)
        ) AS refund_amount,
        json_agg(json_build_object(
          'part_name', sp.part_name,
          'serial_number', sp.serial_number,
          'quantity', ri.quantity
        )) AS items
      FROM returns r
      LEFT JOIN orders o ON r.order_id = o.order_id
      JOIN return_items ri ON ri.return_id = r.return_id
      LEFT JOIN order_items oi ON oi.order_id = r.order_id AND oi.part_id = ri.part_id
      LEFT JOIN users u ON r.admin_id = u.user_id
      LEFT JOIN users seller ON o.user_id = seller.user_id
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN spare_parts sp ON ri.part_id = sp.part_id
      WHERE 1=1`
    const params = []
    if (from) {
      params.push(from)
      query += ` AND r.return_date >= $${params.length}`
    }
    if (to) {
      params.push(to + 'T23:59:59')
      query += ` AND r.return_date <= $${params.length}`
    }
    query += ` GROUP BY r.return_id, r.order_id, r.return_date, u.name, c.name, seller.name, o.discount, o.invoice_number, o.total_amount, o.tax`
    query += ' ORDER BY r.return_date DESC'
    const result = await pool.query(query, params)
    console.log(`[audit/returns] returned ${result.rows.length} rows`)
    res.json(result.rows)
  } catch (err) {
    console.error('[audit/returns] error:', err.message, err.stack)
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
