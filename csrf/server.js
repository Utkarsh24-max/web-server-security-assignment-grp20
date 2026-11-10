require("dotenv").config();

const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const path = require("path");

const authRoutes = require("./routes/auth");
const vulnerableRoutes = require("./routes/vulnerable");
const secureRoutes = require("./routes/secure");
const labRoutes = require("./routes/lab");
const { requireAuth } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  // The lab uses two localhost ports to demonstrate cross-origin requests.
  // Keep CSP enabled, but allow the local demo's inline explanatory markup.
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      formAction: ["'self'", "http://localhost:3001"]
    }
  }
}));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use(session({
  name: "csrf_lab.sid",
  secret: process.env.SESSION_SECRET || "local-only-change-this-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // localhost HTTP only; use HTTPS + secure:true outside this lab
    maxAge: 30 * 60 * 1000
  }
}));

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.get("/", (req, res) => {
  if (req.session.user) return res.redirect("/dashboard");
  res.render("login", { error: null });
});

app.use("/", authRoutes);
app.use("/vulnerable", vulnerableRoutes);
app.use("/secure", secureRoutes);
app.use("/", labRoutes);

app.get("/dashboard", requireAuth, (req, res) => {
  res.render("dashboard", { user: req.session.user });
});

app.use((req, res) => res.status(404).render("error", {
  status: 404, message: "Page not found"
}));

app.listen(PORT, () => {
  console.log(`SecureBank CSRF Lab running at http://localhost:${PORT}`);
  console.log("Attacker demo page: http://localhost:3001/attacker-demo");
});
