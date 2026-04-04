const express = require("express");
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.get("/search/:serial", verifyToken, async (req, res) => {
  const { serial } = req.params;
  try {
    const result = await pool.query(
      "SELECT * FROM spare_parts WHERE serial_number = $1",
      [serial],
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: "Part not found" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM spare_parts ORDER BY part_name",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
