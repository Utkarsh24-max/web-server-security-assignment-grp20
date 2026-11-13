# SQL Lab: authentication bypass

A small local web security demonstration: log in as `admin` **without knowing the password**, then repeat the exact attack against a parameterised query and see it fail.

Built for **SQL injection, Variant 1: Authentication bypass** in the Web Server Security assignment. This is one member's portion; the group must supply its other vulnerability categories separately.

## Run it

Requires Python 3.10+ with pip and venv. No database server, Node.js, API key, or internet connection after dependency installation is needed.

Open a terminal in this project folder.

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python app.py
```

**Windows PowerShell** (activation is unnecessary)

```powershell
py -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe app.py
```

Open **http://127.0.0.1:5000**. Stop the server with **Ctrl+C**. On later runs, just use the environment's Python to run `app.py` again.

If port 5000 is occupied, change `port=5000` at the bottom of `app.py` to `port=5001`, restart, and open http://127.0.0.1:5001 instead. If pip is missing, install a standard Python distribution that includes pip, then recreate the environment.

This intentionally vulnerable lab binds to localhost. Test only this application; do not expose it through public hosting or tunnels. The assignment's public GitHub deliverable is the **source repository**, not a publicly running vulnerable server.

## What you will see

- **Vulnerable login:** SQL built using string interpolation.
- **Fixed login:** the same login check with `?` placeholders and bound parameters.
- **Behind the login:** actual query template/string, parameters for the fixed path, and the database result.
- **Protected dashboard:** requires a signed session created by a successful login.
- **Load a test case:** buttons fill the inputs; you still press **Test login** to submit.

The password field is deliberately visible to make the screen recording readable. SQL and parameter values are displayed for teaching. All data is fictional.

## Live demonstration: follow these steps

Use these exact inputs. The payload has a space after the two hyphens; the **Bypass payload** button includes it.

| Step | Page | Username | Password | Expected result |
| --- | --- | --- | --- | --- |
| 1 | Vulnerable login | `admin` | `wrong` | Access denied; no matching row |
| 2 | Vulnerable login | `admin' -- ` | `wrong` | Authenticated as admin |
| 3 | Click Open protected dashboard | — | — | Dashboard opens without knowing the admin password |
| 4 | Log out; select Fixed login | `admin' -- ` | `wrong` | Access denied; payload treated as data |
| 5 | Fixed login | `admin` | `Admin@123` | Authenticated; legitimate login still works |

For steps 1, 2, 4, and 5 you can use **Wrong password**, **Bypass payload**, and **Valid login**. Selecting either login tab clears the previous session, as does every new login attempt. The demo is stateless apart from its session; refresh or restart to begin again. No database reset command is needed.

The second dummy account is `student` / `Student@123`.

## Why the bypass works

The application normally asks SQLite:

```sql
SELECT id, username, role FROM users
WHERE username = 'admin' AND password = 'wrong'
```

No row matches because the password is wrong. The vulnerable function inserts input into SQL text. With username `admin' -- `, the actual query becomes:

```sql
SELECT id, username, role FROM users WHERE username = 'admin' -- ' AND password = 'wrong'
```

1. `admin` names the target account.
2. `'` closes the username string literal.
3. `-- ` begins a SQL line comment. Everything after it, including the password condition, is ignored.
4. The effective condition is just `username = 'admin'`. SQLite returns the admin row and the application creates a login session.

**Root cause:** untrusted input is concatenated into executable SQL. The application mistakes the returned row for proof that a password was verified.

An optional second local test is username `' OR 1=1 -- ` and password `wrong`. It makes the condition true for all rows; `fetchone()` takes a matching row. Do not assume which account it returns without an ordering guarantee. The targeted `admin' -- ` payload is the clearest one for the video.

## The code to explain

Open `app.py`. Everything needed for the backend is in that file.

**Vulnerable path — `authenticate_vulnerable`:**

```python
query = (
    "SELECT id, username, role FROM users "
    f"WHERE username = '{username}' AND password = '{password}'"
)
return db.execute(query).fetchone(), query
```

**Implemented mitigation — `authenticate_secure`:**

```python
QUERY = "SELECT id, username, role FROM users WHERE username = ? AND password = ?"
return db.execute(QUERY, (username, password)).fetchone(), QUERY
```

The driver receives the fixed SQL and the input values separately. The quote and comment marker in the payload are characters inside a data value; they cannot change the query structure. No username literally named `admin' -- ` exists, so no row is returned. This also works if the payload is typed manually or sent outside the browser; the mitigation is in the database call.

The rest of the file handles routes, session creation, and a tiny disposable SQLite database. `get_db()` creates two dummy users in memory for each request, and the connection is closed afterward. There is no persistent data to lose. Parameter binding in the seed INSERT is separate from the vulnerable login SELECT.

For clarity, both paths compare **plaintext dummy passwords**. This is a teaching simplification, not a production authentication design. Real authentication should look up the username with a parameterised query and verify a salted password hash using a password-hashing library. The “Fixed” label refers to the demonstrated SQL injection flaw, not a complete production security review. A real app should also omit the query/parameter display.

## Other mitigations to explain in the viva

The implemented fix is **parameterised queries**. The assignment also lists the following alternatives/supporting controls:

| Control | Basic idea | Limit |
| --- | --- | --- |
| Allow-list input validation | If a username policy permits only letters, digits, and underscores, reject other characters before processing. For identifiers that cannot be bound, map to known allowed identifiers. | Supplemental to parameter binding; avoid crude keyword blacklists. Passwords should support a broad character set. |
| Least-privilege database access | Give the application's database account only the tables and operations it needs. | Reduces damage, but an allowed SELECT can still bypass authentication. SQLite has no server-level account roles; restrict file/process access in real SQLite deployments. |
| Safe errors | Return a generic failure to the user; keep diagnostic details in restricted logs. | Reduces information disclosure; does not fix unsafe SQL construction. This demo hides raw exceptions but deliberately shows the query for learning. |

These are the alternatives listed in the assignment; consult your lecture slides for any additional class-specific detail. The prevention approach is consistent with the [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).

## Two-to-three-minute video script

| Time | Show | Say in your own words |
| --- | --- | --- |
| 0:00–0:20 | Login page and your ownership row | “I implemented SQL injection authentication bypass. These are local dummy accounts.” |
| 0:20–0:40 | Wrong password rejected | “A normal login requires both username and password to match.” |
| 0:40–1:10 | Payload accepted, then protected dashboard | “The quote closes the string and the comment removes the password check. I get an admin session without the password.” |
| 1:10–1:40 | `authenticate_vulnerable` and `authenticate_secure` | “This interpolation makes input part of SQL. The fix passes parameters separately.” |
| 1:40–2:10 | Identical payload rejected on Fixed login; valid login accepted | “The same payload is now a literal username. The attack fails and legitimate login still works.” |
| 2:10–2:40 | Theory table | Explain allow-lists, least privilege, and safe errors, including their limits. |

Narrate your own portion and understand each line before the viva. Adapt the lab and explanation to your group's work and follow the course's academic-integrity requirements.

## Evidence and submission checklist

Save your own screenshots under `evidence/` after running the demo. Capture the full query and result together.

- [ ] `01-wrong-password.png`: normal rejection on vulnerable page.
- [ ] `02-bypass-success.png`: exact payload, SQL, and authenticated admin result.
- [ ] `03-protected-dashboard.png`: dashboard reached after the bypass.
- [ ] `04-same-payload-blocked.png`: same input rejected on fixed page, with placeholders and bound parameters visible. This is the assignment's mitigation screenshot.
- [ ] `05-valid-login-fixed.png`: real credentials still work.
- [ ] Fill in the ownership row below.
- [ ] Include this source in the group's public GitHub repository; share its link as instructed on the course page.
- [ ] Record and submit the narrated group video or unlisted video link.
- [ ] Review the group coverage requirement: this project covers only the SQL injection portion.

Screenshots and video are not pre-filled evidence; record them from your own run. Do not commit `.venv/` or real credentials.

## Ownership declaration

Replace the placeholders before submission; do not leave them as-is.

| Member name | Roll number | Category | Variant implemented |
| --- | --- | --- | --- |
| YOUR NAME | YOUR ROLL NUMBER | SQL injection | Variant 1: Authentication bypass |

## Verify the behaviour

With the virtual environment active:

```bash
python -m unittest discover -s tests -v
```

On Windows without activation:

```powershell
.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The tests exercise real Flask requests and SQLite queries: invalid credentials, valid credentials on both paths, comment and tautology bypasses, the same payload blocked after the fix, dashboard session access, logout, HTML escaping, and generic SQL errors. They do not require a running server.

## Quick viva questions

**Why is this authentication bypass?** The app creates a session for an account even though the submitted password is wrong.

**Is hiding the attack button a fix?** No. A client can submit arbitrary values; the database call must be safe.

**Does parameter binding delete SQL characters?** No. It treats the complete input as a value, preserving the SQL structure.

**Does hashing passwords fix SQL injection?** No. Hashing protects stored passwords; parameter binding protects query construction.

**Does the fixed page recognise an attack?** No. It simply finds no matching literal username/password pair. The same generic denial is used for other invalid credentials.

**Why show a dashboard?** It verifies that the bypass created authentication state, beyond merely printing a success message. Role-based authorisation is outside this small demo's scope.

## Project map

```text
app.py                    Routes, two login functions, SQLite seed, sessions
templates/base.html       Shared page shell
templates/login.html      Login form, query display, result, explanation
templates/dashboard.html  Protected page
static/style.css          Responsive presentation layout
static/lab.js             Optional form-fill buttons; no security logic
tests/test_app.py         Behaviour and regression checks
requirements.txt          Flask dependency (SQLite ships with Python)
evidence/README.md        Screenshot reminder
```
