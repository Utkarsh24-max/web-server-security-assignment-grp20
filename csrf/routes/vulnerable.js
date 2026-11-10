const express = require("express");
const { requireAuth } = require("../middleware/auth");
const router = express.Router();

// INTENTIONALLY VULNERABLE FOR LOCAL CLASSROOM DEMONSTRATION ONLY.
// Root cause: this GET route performs a state-changing action without CSRF proof.
router.get("/change-email", requireAuth, (req, res) => {
  const email = String(req.query.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).send("Provide a syntactically valid test email address.");
  }
  req.session.user.email = email;
  res.send(`VULNERABLE: email changed to ${escapeHtml(email)}. <a href="/dashboard">Return to dashboard</a>`);
});

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

module.exports = router;
