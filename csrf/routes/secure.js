const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { ensureCsrfToken, verifyCsrfToken } = require("../middleware/csrf");
const router = express.Router();

// A state-changing GET must not be supported.
router.get("/change-email", requireAuth, (req, res) => {
  res.set("Allow", "POST");
  res.status(405).render("error", {
    status: 405,
    message: "Method Not Allowed: email changes require a protected POST request."
  });
});

router.get("/settings", requireAuth, (req, res) => {
  res.render("settings", {
    user: req.session.user,
    csrfToken: ensureCsrfToken(req)
  });
});

router.post("/change-email", requireAuth, verifyCsrfToken, (req, res) => {
  const email = String(req.body.email || "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).render("error", {
      status: 400, message: "Please provide a valid test email address."
    });
  }
  req.session.user.email = email;
  req.session.flash = "Email updated using a valid POST request and CSRF token.";
  res.redirect("/dashboard");
});

module.exports = router;
