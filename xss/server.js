require("dotenv").config();

const express = require("express");
const session = require("express-session");
const path = require("path");
const bcrypt = require("bcryptjs");
const db = require("./database/db");
const authRoutes = require("./routes/auth");
const commentRoutes = require("./routes/comments");
const { requireLogin } = require("./middleware/auth");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.disable("x-powered-by");
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false, limit: "20kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
  name: "storedxss.sid",
  secret: process.env.SESSION_SECRET || "local-only-demo-secret-change-me",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: false, maxAge: 3600000 }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.mode = req.session.mode || "secure";
  res.locals.notice = req.session.notice || null;
  delete req.session.notice;
  next();
});

app.use(authRoutes);
app.use(commentRoutes);

app.get("/", (req, res) => res.redirect(req.session.user ? "/forum" : "/login"));

app.get("/forum", requireLogin, (req, res) => {
  const post = db.get(`
    SELECT p.id, p.title, p.body, p.created_at,
           (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
    FROM posts p ORDER BY p.id LIMIT 1
  `);
  res.render("forum", { pageTitle: "Community Forum", post });
});

app.get("/posts/:postId", requireLogin, (req, res) => {
  const postId = Number(req.params.postId);
  const post = db.get("SELECT * FROM posts WHERE id = ?", [postId]);
  if (!post) return res.status(404).send("Discussion not found.");

  const comments = db.all(`
    SELECT c.id, c.content, c.created_at, u.username
    FROM comments c JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ? ORDER BY c.id
  `, [postId]);

  res.render("discussion", { pageTitle: post.title, post, comments });
});

app.post("/mode", requireLogin, (req, res) => {
  const mode = String(req.body.mode || "");
  if (!["vulnerable", "secure"].includes(mode)) return res.status(400).send("Invalid mode.");
  req.session.mode = mode;
  req.session.notice = `Rendering mode changed to ${mode}.`;
  res.redirect(req.get("referer") || "/forum");
});

app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use((req, res) => res.status(404).send("Page not found."));

async function start() {
  await db.initializeDatabase();

  if (!db.get("SELECT id FROM users WHERE username = ?", ["alice"])) {
    db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", ["alice", bcrypt.hashSync("alice123", 10)]);
  }
  if (!db.get("SELECT id FROM users WHERE username = ?", ["bob"])) {
    db.run("INSERT INTO users (username, password_hash) VALUES (?, ?)", ["bob", bcrypt.hashSync("bob123", 10)]);
  }
  if (!db.get("SELECT id FROM posts LIMIT 1")) {
    db.run("INSERT INTO posts (title, body) VALUES (?, ?)", [
      "Welcome to the Community Forum",
      "Share ideas and questions with other community members. This local forum is also a controlled Stored XSS security lab."
    ]);
  }

  app.listen(PORT, "127.0.0.1", () => {
    console.log(`Stored XSS lab running at http://127.0.0.1:${PORT}`);
    console.log("LOCAL EDUCATIONAL DEMO ONLY — do not expose vulnerable mode to a network.");
  });
}

start().catch((err) => {
  console.error("Application startup failed:", err);
  process.exit(1);
});
