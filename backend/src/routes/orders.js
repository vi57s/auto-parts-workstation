const express = require("express");
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/sell", verifyToken, async (req, res) => {
  const { serial_number, quantity, discount = 0 } = req.body;
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      "SELECT * FROM create_sale_by_serial($1, $2, $3, $4)",
      [serial_number, quantity, user_id, discount],
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT o.*, u.name as worker_name FROM orders o LEFT JOIN users u ON o.user_id = u.user_id ORDER BY o.created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
