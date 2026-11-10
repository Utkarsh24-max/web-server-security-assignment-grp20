const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { ensureCsrfToken } = require("../middleware/csrf");
const router = express.Router();

router.get("/lab", requireAuth, (req, res) => {
  res.render("lab", {
    user: req.session.user,
    csrfToken: ensureCsrfToken(req)
  });
});

// Separate-port attacker page. This is served by the second local server in attacker.js.
router.get("/attacker-demo", (req, res) => {
  res.status(404).send("The attacker demo is served on http://localhost:3001/attacker-demo. Start the second server.");
});

module.exports = router;
