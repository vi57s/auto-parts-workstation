const express = require("express");
const pool = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();


router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  const { order_id, items } = req.body;
  const admin_id = req.user.user_id;

  if (!order_id || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "order_id and items array are required" });
  }

  await pool.query("BEGIN");
  try {
    for (const { part_id, quantity } of items) {
      if (!part_id || !quantity || quantity <= 0) {
        throw new Error("Each item requires part_id and positive quantity");
      }

      const orderItemResult = await pool.query(
        `SELECT quantity FROM order_items WHERE order_id = $1 AND part_id = $2`,
        [order_id, part_id]
      );
      if (!orderItemResult.rows.length) {
        throw new Error(`Part ${part_id} not found in order ${order_id}`);
      }
      const soldQty = parseInt(orderItemResult.rows[0].quantity, 10);

      const alreadyReturnedResult = await pool.query(
        `SELECT COALESCE(SUM(ri.quantity), 0) AS total
         FROM return_items ri
         JOIN returns r ON ri.return_id = r.return_id
         WHERE r.order_id = $1 AND ri.part_id = $2`,
        [order_id, part_id]
      );
      const alreadyReturned = parseInt(alreadyReturnedResult.rows[0].total, 10);

      if (alreadyReturned + quantity > soldQty) {
        throw new Error(`Return quantity exceeds available for part ${part_id}`);
      }
    }

    const returnResult = await pool.query(
      `INSERT INTO returns (order_id, admin_id, return_date) VALUES ($1, $2, NOW()) RETURNING return_id`,
      [order_id, admin_id]
    );
    const returnId = returnResult.rows[0].return_id;

    for (const { part_id, quantity } of items) {
      await pool.query(
        `INSERT INTO return_items (return_id, part_id, quantity) VALUES ($1, $2, $3)`,
        [returnId, part_id, quantity]
      );
      await pool.query(
        `UPDATE spare_parts SET quantity = quantity + $1 WHERE part_id = $2`,
        [quantity, part_id]
      );
    }

    await pool.query("COMMIT");
    res.json({ return_id: returnId, message: "Return processed successfully" });
  } catch (err) {
    await pool.query("ROLLBACK");
    console.error('[returns POST /] error:', err.message);
    res.status(400).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const intervalMap = { admin: "14 days", worker: "3 days" };
    let where = "";
    if (intervalMap[req.user.role]) {
      where = `WHERE r.return_date >= NOW() - INTERVAL '${intervalMap[req.user.role]}'`;
    }
    const result = await pool.query(
      `SELECT
         r.return_id,
         r.order_id,
         r.return_date,
         r.admin_id,
         u.name AS admin_name,
         o.invoice_number,
         o.discount,
         o.total_amount,
         o.tax,
         SUM(ri.quantity) AS total_quantity,
         SUM(
           ri.quantity
           * COALESCE(oi.unit_price, 0)
           * (1 - COALESCE(oi.discount, 0)::numeric / 100)
           * (1 + CASE WHEN (o.total_amount - o.tax) > 0 THEN o.tax::numeric / (o.total_amount - o.tax) ELSE 0 END)
         ) AS refund_amount,
         json_agg(json_build_object(
           'part_id', ri.part_id,
           'part_name', sp.part_name,
           'serial_number', sp.serial_number,
           'quantity', ri.quantity
         )) AS items
       FROM returns r
       LEFT JOIN users u ON r.admin_id = u.user_id
       LEFT JOIN orders o ON r.order_id = o.order_id
       JOIN return_items ri ON ri.return_id = r.return_id
       LEFT JOIN order_items oi ON oi.order_id = r.order_id AND oi.part_id = ri.part_id
       LEFT JOIN spare_parts sp ON sp.part_id = ri.part_id
       ${where}
       GROUP BY r.return_id, r.order_id, r.return_date, r.admin_id, u.name,
                o.invoice_number, o.discount, o.total_amount, o.tax
       ORDER BY r.return_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[returns GET /] error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
