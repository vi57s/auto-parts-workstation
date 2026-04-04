const express = require("express");
const pool = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/statement", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT vip.*,
              u.name AS worker_name,
              c.name AS customer_name,
              c.customer_type,
              r.return_id,
              r.part_id AS returned_part_id,
              r.quantity AS returned_quantity,
              r.refund_amount,
              r.return_date,
              ra.name AS return_admin_name
       FROM view_invoice_profits vip
       LEFT JOIN users u ON vip.user_id = u.user_id
       LEFT JOIN customers c ON vip.customer_id = c.customer_id
       LEFT JOIN returns r ON vip.order_id = r.order_id
       LEFT JOIN users ra ON r.admin_id = ra.user_id
       ORDER BY vip.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/sell", verifyToken, async (req, res) => {
  const {
    serial_number,
    quantity,
    discount = 0,
    invoice_type = "cash",
    customer_id = null,
    tax_rate = 0,
  } = req.body;
  const user_id = req.user.user_id;

  if (!serial_number || !quantity) {
    return res.status(400).json({ message: "serial_number and quantity are required" });
  }

  if (invoice_type === "credit" && !customer_id) {
    return res.status(400).json({ message: "customer_id is required for credit invoices" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM create_sale_by_serial($1, $2, $3, $4, $5, $6, $7)",
      [serial_number, quantity, user_id, discount, invoice_type, customer_id, tax_rate]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, u.name AS worker_name, c.name AS customer_name
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.user_id
       LEFT JOIN customers c ON o.customer_id = c.customer_id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const orderResult = await pool.query(
      `SELECT o.*, u.name AS worker_name, c.name AS customer_name, c.phone AS customer_phone, c.customer_type
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.user_id
       LEFT JOIN customers c ON o.customer_id = c.customer_id
       WHERE o.order_id = $1`,
      [id]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    const itemsResult = await pool.query(
      `SELECT oi.*, sp.part_name, sp.serial_number
       FROM order_items oi
       LEFT JOIN spare_parts sp ON oi.part_id = sp.part_id
       WHERE oi.order_id = $1`,
      [id]
    );

    res.json({ ...orderResult.rows[0], items: itemsResult.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
