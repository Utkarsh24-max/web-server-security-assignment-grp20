const crypto = require("crypto");

function ensureCsrfToken(req) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }
  return req.session.csrfToken;
}

function verifyCsrfToken(req, res, next) {
  const submitted = req.body && req.body.csrfToken;
  const expected = req.session.csrfToken;

  // timingSafeEqual requires buffers of equal length.
  if (typeof submitted !== "string" || typeof expected !== "string") {
    return res.status(403).render("error", {
      status: 403,
      message: "CSRF validation failed: token missing or invalid."
    });
  }

  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(403).render("error", {
      status: 403,
      message: "CSRF validation failed: token missing or invalid."
    });
  }
  next();
}

module.exports = { ensureCsrfToken, verifyCsrfToken };
