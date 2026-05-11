const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { verifyToken, verifyAdmin } = require("../middleware/auth");

const router = express.Router();

async function loadTargetUser(id) {
  const result = await pool.query(
    "SELECT user_id, role FROM users WHERE user_id = $1",
    [id],
  );
  return result.rows[0] || null;
}

function canActOnTarget(actorRole, targetRole) {
  if (actorRole === "owner") return targetRole !== "owner";
  if (actorRole === "admin") return targetRole === "worker";
  return false;
}

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", verifyToken, verifyAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  const actorRole = req.user.role;

  if (!["owner", "admin", "worker"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  if (actorRole === "admin" && role !== "worker") {
    return res
      .status(403)
      .json({ message: "Admins can only create worker accounts" });
  }

  if (actorRole !== "owner" && role === "owner") {
    return res
      .status(403)
      .json({ message: "Only the owner can create another owner" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role",
      [name, email, hash, role],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/password", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const actorRole = req.user.role;
  const actorId = req.user.user_id;

  if (!password || typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ message: "password is required" });
  }

  if (String(actorId) === String(id)) {
    return res
      .status(400)
      .json({ message: "Use change-password to update your own password" });
  }

  try {
    const target = await loadTargetUser(id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!canActOnTarget(actorRole, target.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to reset this user's password" });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE user_id = $2",
      [hash, id],
    );
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", verifyToken, verifyAdmin, async (req, res) => {
  const { id } = req.params;
  const actorRole = req.user.role;
  const actorId = req.user.user_id;

  if (String(actorId) === String(id)) {
    return res.status(400).json({ message: "You cannot delete your own account" });
  }

  try {
    const target = await loadTargetUser(id);
    if (!target) {
      return res.status(404).json({ message: "User not found" });
    }

    if (target.role === "owner") {
      return res
        .status(403)
        .json({ message: "The owner account cannot be deleted via this endpoint" });
    }

    if (!canActOnTarget(actorRole, target.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to delete this user" });
    }

    await pool.query("DELETE FROM users WHERE user_id = $1", [id]);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
