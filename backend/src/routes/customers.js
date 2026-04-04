const express = require("express");
const pool = require("../config/db");
const { verifyToken } = require("../middleware/auth");

const router = express.Router();

router.post("/", verifyToken, async (req, res) => {
  const { name, phone, address, customer_type } = req.body;

  if (!name || !customer_type) {
    return res.status(400).json({ message: "name and customer_type are required" });
  }

  if (!["individual", "store"].includes(customer_type)) {
    return res.status(400).json({ message: "customer_type must be 'individual' or 'store'" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO customers (name, phone, address, customer_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, phone, address, customer_type]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/", verifyToken, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY name");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("SELECT * FROM customers WHERE customer_id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Customer not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
