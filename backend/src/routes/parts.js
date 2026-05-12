const express = require("express");
const pool = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

async function logInventory(action_type, part_id, serial_number, part_name, performed_by_id, changes) {
  try {
    const userRes = await pool.query("SELECT name FROM users WHERE user_id = $1", [performed_by_id])
    const performed_by_name = userRes.rows[0]?.name || "Unknown"
    await pool.query(
      `INSERT INTO inventory_log (action_type, part_id, serial_number, part_name, performed_by_id, performed_by_name, changes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [action_type, part_id, serial_number, part_name, performed_by_id, performed_by_name, JSON.stringify(changes)]
    )
  } catch {
    // logging failure must not break the main operation
  }
}

router.get("/search/:serial", verifyToken, async (req, res) => {
  const { serial } = req.params;
  try {
    const result = await pool.query(
      "SELECT part_id, serial_number, part_name, location, quantity, price, cost_price, admin_id FROM spare_parts WHERE serial_number = $1",
      [serial]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Part not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT part_id, serial_number, part_name, location, quantity, price, cost_price, admin_id, created_at FROM spare_parts ORDER BY part_name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/depleting-soon", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         sp.part_id,
         sp.serial_number,
         sp.part_name,
         sp.quantity AS current_stock,
         sp.location,
         sp.price,
         sp.cost_price,
         sp.created_at,
         COALESCE(SUM(oi.quantity), 0) AS sold_last_30_days,
         ROUND(COALESCE(SUM(oi.quantity), 0)::numeric / 30, 2) AS daily_rate,
         ROUND(sp.quantity::numeric / (COALESCE(SUM(oi.quantity), 0)::numeric / 30), 1) AS days_until_depletion
       FROM spare_parts sp
       LEFT JOIN order_items oi ON oi.part_id = sp.part_id
       LEFT JOIN orders o ON o.order_id = oi.order_id
         AND o.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY sp.part_id, sp.serial_number, sp.part_name, sp.quantity, sp.location, sp.price, sp.cost_price, sp.created_at
       HAVING
         COALESCE(SUM(oi.quantity), 0) > 0
         AND ROUND(sp.quantity::numeric / (COALESCE(SUM(oi.quantity), 0)::numeric / 30), 1) <= 14
       ORDER BY days_until_depletion ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/sales", verifyToken, async (req, res) => {
  const { id } = req.params
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  const dateFrom = req.query.from || from.toISOString().split('T')[0]
  const dateTo = req.query.to || to.toISOString().split('T')[0]
  const dateToEnd = dateTo + 'T23:59:59'

  try {
    const soldRes = await pool.query(
      `SELECT COALESCE(SUM(oi.quantity), 0) AS total_sold
       FROM order_items oi
       JOIN orders o ON o.order_id = oi.order_id
       WHERE oi.part_id = $1
         AND o.created_at >= $2
         AND o.created_at <= $3`,
      [id, dateFrom, dateToEnd]
    )
    const returnedRes = await pool.query(
      `SELECT COALESCE(SUM(quantity), 0) AS total_returned
       FROM returns
       WHERE part_id = $1
         AND return_date >= $2
         AND return_date <= $3`,
      [id, dateFrom, dateToEnd]
    )
    const total_sold = parseInt(soldRes.rows[0].total_sold, 10)
    const total_returned = parseInt(returnedRes.rows[0].total_returned, 10)
    res.json({
      total_sold,
      total_returned,
      net_sold: total_sold - total_returned,
      from: dateFrom,
      to: dateTo,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  const { serial_number, part_name, location, quantity, price, cost_price } = req.body;
  const admin_id = req.user.user_id;

  if (!serial_number || !part_name || quantity == null || price == null || cost_price == null) {
    return res.status(400).json({ message: "serial_number, part_name, quantity, price, and cost_price are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO spare_parts (serial_number, part_name, location, quantity, price, cost_price, admin_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [serial_number, part_name, location, quantity, price, cost_price, admin_id]
    );
    const part = result.rows[0]
    await logInventory("add", part.part_id, serial_number, part_name, admin_id, {
      serial_number, part_name, location, quantity, price, cost_price,
    })
    res.status(201).json(part);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { serial_number, part_name, location, quantity, price, cost_price } = req.body;
  const admin_id = req.user.user_id;

  try {
    const existing = await pool.query("SELECT * FROM spare_parts WHERE part_id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Part not found" });
    }

    const old = existing.rows[0]
    const result = await pool.query(
      `UPDATE spare_parts
       SET serial_number = COALESCE($1, serial_number),
           part_name = COALESCE($2, part_name),
           location = COALESCE($3, location),
           quantity = COALESCE($4, quantity),
           price = COALESCE($5, price),
           cost_price = COALESCE($6, cost_price),
           admin_id = $7
       WHERE part_id = $8
       RETURNING *`,
      [serial_number, part_name, location, quantity, price, cost_price, admin_id, id]
    );
    const updated = result.rows[0]

    const changes = {}
    const fields = ["serial_number", "part_name", "location", "quantity", "price", "cost_price"]
    for (const f of fields) {
      const newVal = req.body[f]
      if (newVal != null && String(newVal) !== String(old[f])) {
        changes[f] = { from: old[f], to: newVal }
      }
    }
    await logInventory("edit", updated.part_id, updated.serial_number, updated.part_name, admin_id, changes)

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const admin_id = req.user.user_id;

  try {
    const existing = await pool.query("SELECT * FROM spare_parts WHERE part_id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Part not found" });
    }

    const part = existing.rows[0]
    await pool.query("DELETE FROM spare_parts WHERE part_id = $1", [id]);
    await logInventory("delete", part.part_id, part.serial_number, part.part_name, admin_id, {
      serial_number: part.serial_number,
      part_name: part.part_name,
      location: part.location,
      quantity: part.quantity,
      price: part.price,
      cost_price: part.cost_price,
    })

    res.json({ message: "Part deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
