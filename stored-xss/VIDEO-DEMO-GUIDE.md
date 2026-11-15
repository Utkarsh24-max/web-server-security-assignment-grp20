# Stored XSS – 2–3 Minute Video Demonstration Guide

## Demo order

1. Show the community forum and introduce Stored XSS.
2. Log in as Alice and submit the harmless test payload.
3. Log out, log in as Bob, and show the alert in vulnerable mode.
4. Refresh to prove persistence.
5. Show `views/discussion.ejs` and explain `<%- comment.content %>`.
6. Switch Bob's session to secure mode.
7. Show the same stored comment rendered as text.
8. Explain `<%= comment.content %>` and briefly mention other defences.

## Suggested narration

"Hello everyone. My assigned vulnerability is Stored Cross-Site Scripting, also called Persistent XSS. It occurs when untrusted input is stored by an application and later rendered to another user without proper output handling.

Here Alice submits a comment containing a harmless test payload. The server stores the original comment in the SQLite database. When Bob opens the same discussion in vulnerable mode, the browser interprets the stored markup and executes its event handler. Refreshing the page demonstrates persistence.

The database does not execute JavaScript. The execution happens in Bob's browser when the stored content is rendered as HTML.

The vulnerable EJS statement uses unescaped output. I mitigate this using EJS escaped output, which performs HTML escaping for this text context. Now the same stored payload is displayed as text and does not execute.

Other defences include sanitization when rich HTML is needed, CSP as defence-in-depth, HttpOnly cookies, and safe DOM methods such as textContent. Thank you."

## Screenshots to capture

- `screenshots/vulnerable.png`: alert visible in Bob's vulnerable-mode session.
- `screenshots/database.png`: original payload stored in the comments table.
- `screenshots/secure.png`: same stored payload displayed as text in secure mode.

## Recording tips

- Use a readable browser zoom (90–100%).
- Keep the terminal and editor font large enough.
- Do not spend time showing unrelated files.
- Keep the same comment in the database for both modes.
- Do not demonstrate cookie theft, credential theft, or external callbacks.
