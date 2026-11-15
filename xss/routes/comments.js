const express = require("express");
const db = require("../database/db");
const { requireLogin } = require("../middleware/auth");
const router = express.Router();

router.post("/posts/:postId/comments", requireLogin, (req, res) => {
  const postId = Number(req.params.postId);
  const post = db.get("SELECT id FROM posts WHERE id = ?", [postId]);
  const content = String(req.body.content || "").trim();

  if (!post) return res.status(404).send("Discussion not found.");
  if (!content || content.length > 1000) {
    req.session.notice = "Enter a comment of 1–1,000 characters.";
    return res.redirect(`/posts/${postId}`);
  }

  // Store the original user input. Escape it when rendering, not before storage.
  db.run("INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
    [postId, req.session.user.id, content]);
  req.session.notice = "Comment saved.";
  res.redirect(`/posts/${postId}`);
});

router.post("/comments/reset", requireLogin, (req, res) => {
  db.run("DELETE FROM comments");
  req.session.notice = "All demonstration comments were cleared.";
  res.redirect("/forum");
});

module.exports = router;
