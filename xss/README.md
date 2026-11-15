# Stored XSS Demonstration – Secure Community Forum

A local-only educational application demonstrating Stored Cross-Site Scripting and one mitigation: HTML output escaping with EJS.

## Safety

The vulnerable rendering mode intentionally renders stored user input as HTML. It is included only for a controlled classroom demonstration. The server binds to `127.0.0.1`. Do not deploy this application, expose it through port forwarding, or use vulnerable mode on a public website.

## Requirements

- Windows 10/11 64-bit
- Node.js 18 or newer (tested target: Node.js 24)
- npm
- VS Code (optional)

This project uses `sql.js` (SQLite compiled to WebAssembly), so it does not require Visual Studio C++ Build Tools or a separately installed SQLite command-line program.

## Install and run (Windows PowerShell)

Open the extracted project folder in VS Code, then Terminal → New Terminal:

```powershell
node -v
npm -v
npm install
Copy-Item .env.example .env
npm run dev
```

Open `http://127.0.0.1:3000`.

Stop the server with `Ctrl+C`.

For normal start without auto-reload, use `npm start`. Run the included tests with `npm test`.

## Demo accounts

| Role | Username | Password |
|---|---|---|
| Alice – attacker simulation | `alice` | `alice123` |
| Bob – victim simulation | `bob` | `bob123` |

These are local classroom demo credentials only.

## Stored XSS demonstration

1. Log in as Alice.
2. On the discussion page, select **Vulnerable** mode.
3. Submit this harmless payload as a comment:

   ```html
   <img src=x onerror="alert('Stored XSS demonstrated')">
   ```

4. The original comment is stored in `data/forum.sqlite`.
5. Log out and log in as Bob.
6. Set Bob's session to Vulnerable mode and open the discussion. The browser should display the alert.
7. Refresh to demonstrate that the stored content executes again.
8. Switch Bob's session to Secure mode and revisit the same comment.
9. The same database value should display as text rather than executing.
10. Use **Reset all demo comments** to repeat the demonstration.

The rendering mode is session-specific. Set Bob's own mode before the victim demonstration.

## Root cause and mitigation

In `views/discussion.ejs`, vulnerable mode uses:

```ejs
<%- comment.content %>
```

EJS `<%- ... %>` outputs unescaped HTML. Untrusted markup can be interpreted by the browser.

Secure mode uses:

```ejs
<%= comment.content %>
```

EJS `<%= ... %>` escapes HTML output. In this HTML text context, the payload is shown as text. The application stores the original comment and escapes it at rendering time.

Do not treat HTML escaping as a universal encoder for JavaScript, CSS, URL or other contexts. Encoding must match the output context.

## Database

The SQLite database is automatically created at `data/forum.sqlite`. It contains:

- `users`: usernames and bcrypt password hashes
- `posts`: discussion posts
- `comments`: original comment content, author, post and timestamp

`sql.js` runs SQLite through WebAssembly and exports the database file after writes. No native compilation or SQLite CLI is needed.

## Other defences to explain in the viva

- Framework auto-escaping and context-aware output encoding.
- HTML sanitization with a maintained allow-list sanitizer if limited rich HTML is genuinely required.
- Content Security Policy as defence-in-depth, not a replacement for output encoding.
- HttpOnly cookies reduce JavaScript access to cookies but do not stop XSS execution.
- Safe DOM APIs such as `textContent`; avoid unsafe `innerHTML` for untrusted strings.
- Input validation alone and HTTPS alone do not prevent XSS.

## Screenshots

Capture your own screenshots while running the application and save them in `screenshots/`:

- `vulnerable.png`: alert visible in vulnerable mode.
- `database.png`: stored comment row in SQLite (you may use a SQLite viewer extension).
- `secure.png`: same payload displayed as text in secure mode.

## Troubleshooting

- If `npm` is not recognised, reopen the terminal after installing Node.js.
- If port 3000 is busy, set `PORT=3001` in `.env` and restart.
- If install fails, copy the complete error output. Do not install Visual Studio Build Tools pre-emptively; `sql.js` does not require native compilation.
- To reset all comments, use the reset button in the discussion page.
- To reset the entire database, stop the server, delete `data/forum.sqlite`, and restart. The demo users and post are recreated.

## Scope and limitations

This is a classroom demonstration, not a production-ready forum. It does not implement production-grade CSRF protection, rate limiting, persistent session storage, HTTPS, registration, or deployment hardening. The intentionally vulnerable mode must remain local-only.


# Stored XSS – Secure Community Forum

**Category:** Cross-Site Scripting
**Variant:** Stored XSS

## Implementation

A local community forum demonstrating Stored Cross-Site
Scripting using Node.js, Express, EJS and SQLite.

## Vulnerable Implementation

Unescaped EJS output:

<%- comment.content %>

## Implemented Mitigation

HTML output escaping:

<%= comment.content %>

## Demo Accounts

Alice: alice / alice123
Bob: bob / bob123

## Run

npm install
Copy-Item .env.example .env
npm run dev