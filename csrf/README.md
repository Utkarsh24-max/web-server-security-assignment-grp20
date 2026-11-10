# SecureBank – GET-Based CSRF Security Lab

**Course:** Cyber Security (IT-30001), IIIT Allahabad, Autumn Semester 2026  
**Variant:** Cross-Site Request Forgery – GET-based forged action

> Local educational demonstration only. Do not deploy the vulnerable route or use it against any third-party service.

## Features

- Express application with session-based login.
- Intentionally vulnerable GET route that changes the logged-in user's test email.
- Separate local attacker page on port 3001 to demonstrate a cross-origin request.
- Secured implementation: GET returns `405 Method Not Allowed`; state changes use POST and a synchronizer CSRF token.
- Negative test for missing CSRF token.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

Terminal 1:

```bash
npm install
cp .env.example .env
npm start
```

Open http://localhost:3000

Terminal 2 (leave Terminal 1 running):

```bash
node attacker.js
```

Open http://localhost:3001/attacker-demo

On Windows PowerShell, copy the environment file with:

```powershell
Copy-Item .env.example .env
```

Demo credentials:

- `alice` / `password123`
- `bob` / `password123`

## Demonstration steps

### A. Vulnerable GET-based CSRF

1. Open `http://localhost:3000` and log in as Alice.
2. Keep the SecureBank session active in the same browser.
3. Open `http://localhost:3001/attacker-demo` in another tab.
4. Click **Trigger local GET-based CSRF demo**.
5. The browser sends a cross-origin GET request to port 3000. With the default `SameSite=Lax` cookie, a top-level cross-site GET navigation can include the session cookie.
6. Return to `http://localhost:3000/dashboard`. The email should now be `csrf-demo@example.test`.

### B. Secured implementation

1. Open `http://localhost:3000/lab`.
2. Click **Attempt secured GET**. It must return HTTP 405 and must not update the email.
3. Open **Secure settings**.
4. Submit the legitimate form. It sends POST with a session-bound CSRF token and should succeed.
5. Submit the negative-test form without a token. It should return HTTP 403 and must not update the email.

## Vulnerable route and root cause

`routes/vulnerable.js` implements:

```js
router.get("/change-email", requireAuth, (req, res) => {
  // Reads email from query string and mutates session state.
});
```

The flaw is that a GET request performs a state-changing operation without proof that the authenticated user intended it. Browsers can automatically attach eligible cookies to requests, so an attacker-controlled page may cause a victim's browser to issue the request.

## Mitigation

- GET is not allowed to change account state; the secured GET endpoint returns 405.
- The legitimate change uses POST.
- A synchronizer token is generated and stored in the server-side session.
- The POST middleware compares the submitted token with the session token.
- Session cookies use `HttpOnly` and `SameSite=Lax` as additional protections.

`SameSite` is defence-in-depth, not a replacement for CSRF tokens and correct HTTP method semantics. Cookie behaviour also depends on browser policy and request context.

## Other mitigation alternatives (theory)

- **Synchronizer tokens:** Generate an unpredictable token tied to the user's session and require it on state-changing requests. An attacker on another origin cannot normally read the token due to the same-origin policy.
- **SameSite cookies:** Ask the browser to restrict when cookies accompany cross-site requests. `Lax` blocks many cross-site subrequests while allowing some top-level safe-method navigations; `Strict` is more restrictive. It is defence-in-depth.
- **Re-authentication:** Require the user to authenticate again before especially sensitive operations. This makes silently forged actions harder.
- **Avoid state-changing GET:** GET should be safe and read-only. Use POST/PUT/PATCH/DELETE for mutations and protect them against CSRF.

## Viva preparation

**1. What is CSRF?**  
An attack that tricks a victim's authenticated browser into sending an unwanted request to an application.

**2. Why is the vulnerable endpoint exploitable?**  
It changes server-side account state through GET and relies only on the victim's existing session cookie.

**3. Why does authentication not prevent CSRF?**  
Authentication identifies the account; it does not prove that the user intended this particular request.

**4. Why is GET unsuitable for changing email?**  
GET is expected to be safe and read-only. Browsers, crawlers, previews and other systems may issue GET requests automatically.

**5. What does a CSRF token do?**  
It proves that the request came through a legitimate application flow that had access to the session-bound token.

**6. Is SameSite a complete solution?**  
No. It is an additional browser-level defence. Tokens and safe endpoint design remain important.

**7. Why does the demo use two ports?**  
`localhost:3000` and `localhost:3001` are different origins, allowing a controlled cross-origin request demonstration.

**8. What is the expected result of the secured GET attempt?**  
HTTP 405 Method Not Allowed, with no account state change.

## Important limitations

This is a teaching prototype, not production authentication. Demo passwords are intentionally simple and stored in memory. The default session store is not suitable for production. Use HTTPS, secure cookies, a production session store, password hashing, rate limiting and robust validation in a real application.
