const express = require("express");
const pool = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

function intervalForRole(role) {
  if (role === "owner") return null;
  if (role === "admin") return "14 days";
  return "3 days";
}

router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  const { order_id, part_id, quantity } = req.body;
  const admin_id = req.user.user_id;

  if (!order_id || !part_id || !quantity) {
    return res.status(400).json({ message: "order_id, part_id, and quantity are required" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM process_part_return($1, $2, $3, $4)",
      [order_id, part_id, quantity, admin_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const interval = intervalForRole(req.user.role);
    let where = "";
    if (interval) {
      where = `WHERE r.return_date >= NOW() - INTERVAL '${interval}'`;
    }
    const result = await pool.query(
      `SELECT r.*, u.name AS admin_name, sp.part_name, sp.serial_number, o.total_amount AS order_total, o.status AS order_status
       FROM returns r
       LEFT JOIN users u ON r.admin_id = u.user_id
       LEFT JOIN spare_parts sp ON r.part_id = sp.part_id
       LEFT JOIN orders o ON r.order_id = o.order_id
       ${where}
       ORDER BY r.return_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
