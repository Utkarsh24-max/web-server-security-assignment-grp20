const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../database/db");
const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.user) return res.redirect("/forum");
  res.render("login", { pageTitle: "Login", error: null });
});

router.post("/login", (req, res) => {
  const username = String(req.body.username || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const user = db.get("SELECT id, username, password_hash FROM users WHERE username = ?", [username]);

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).render("login", { pageTitle: "Login", error: "Invalid username or password." });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).send("Could not create session.");
    req.session.user = { id: user.id, username: user.username };
    req.session.mode = "vulnerable";
    res.redirect("/forum");
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("storedxss.sid");
    res.redirect("/login");
  });
});

module.exports = router;
