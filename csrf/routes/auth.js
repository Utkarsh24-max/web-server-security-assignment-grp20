const express = require("express");
const router = express.Router();

// In-memory demo accounts. Never use plaintext passwords in a real application.
const users = {
  alice: { username: "alice", password: "password123", email: "alice@example.test" },
  bob: { username: "bob", password: "password123", email: "bob@example.test" }
};

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users[username];
  if (!user || user.password !== password) {
    return res.status(401).render("login", { error: "Invalid demo credentials." });
  }

  req.session.regenerate((err) => {
    if (err) return res.status(500).send("Could not create session.");
    req.session.user = { username: user.username, email: user.email };
    req.session.csrfToken = require("crypto").randomBytes(32).toString("hex");
    res.redirect("/dashboard");
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

module.exports = router;
