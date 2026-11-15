const test = require("node:test");
const assert = require("node:assert/strict");

test("discussion template contains both the vulnerable and escaped output paths", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const view = fs.readFileSync(path.join(__dirname, "..", "views", "discussion.ejs"), "utf8");
  assert.ok(view.includes("<%= comment.content %>"));
  assert.ok(view.includes("<%- comment.content %>"));
});

test("the demo payload is a harmless local alert payload", () => {
  const payload = `<img src=x onerror="alert('Stored XSS demonstrated')">`;
  assert.ok(payload.includes("alert('Stored XSS demonstrated')"));
  assert.doesNotMatch(payload, /fetch\(|document\.cookie|XMLHttpRequest/i);
});
