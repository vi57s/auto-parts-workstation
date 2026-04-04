const express = require("express");
const pool = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

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
    res.status(201).json(result.rows[0]);
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
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
