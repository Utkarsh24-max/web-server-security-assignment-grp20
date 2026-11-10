function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).send("Please log in first. <a href='/'>Login</a>");
  }
  next();
}
module.exports = { requireAuth };
