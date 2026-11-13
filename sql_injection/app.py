"""Local teaching lab: the two authenticate functions are the viva's key code."""

import secrets
import sqlite3

from flask import Flask, abort, g, redirect, render_template, request, session, url_for


QUERY = "SELECT id, username, role FROM users WHERE username = ? AND password = ?"
DEMO_USERS = [(1, "admin", "Admin@123", "Administrator"),
              (2, "student", "Student@123", "Student")]


def get_db():
    """A fresh, disposable SQLite database per request; no real data."""
    if "db" not in g:
        g.db = sqlite3.connect(":memory:")
        g.db.row_factory = sqlite3.Row
        g.db.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, role TEXT)")
        g.db.executemany("INSERT INTO users VALUES (?, ?, ?, ?)", DEMO_USERS)
    return g.db


def authenticate_vulnerable(db, username, password):
    # INTENTIONALLY VULNERABLE: input becomes part of SQL syntax.
    query = (
        "SELECT id, username, role FROM users "
        f"WHERE username = '{username}' AND password = '{password}'"
    )
    return db.execute(query).fetchone(), query


def authenticate_secure(db, username, password):
    # MITIGATION: the SQL template and bound data travel separately.
    return db.execute(QUERY, (username, password)).fetchone(), QUERY


def create_app():
    app = Flask(__name__)
    app.config.update(SECRET_KEY=secrets.token_hex(32), MAX_CONTENT_LENGTH=8192,
                      SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax")

    @app.teardown_appcontext
    def close_db(error=None):
        db = g.pop("db", None)
        if db is not None:
            db.close()

    @app.get("/")
    def index():
        return redirect(url_for("login", mode="vulnerable"))

    @app.route("/login/<mode>", methods=["GET", "POST"])
    def login(mode):
        if mode not in ("vulnerable", "secure"):
            abort(404)
        # Each attempt starts unauthenticated, including after a previous bypass.
        session.clear()
        context = dict(mode=mode, attempted=False, username="", password="",
                       query=None, parameters=None, user=None, error=False)
        status = 200
        if request.method == "POST":
            username = request.form.get("username", "")
            password = request.form.get("password", "")
            context.update(attempted=True, username=username, password=password)
            if mode == "secure":
                context.update(query=QUERY, parameters=[username, password])
            else:
                context["query"] = (
                    "SELECT id, username, role FROM users "
                    f"WHERE username = '{username}' AND password = '{password}'"
                )
            try:
                authenticate = authenticate_secure if mode == "secure" else authenticate_vulnerable
                user, query = authenticate(get_db(), username, password)
                context.update(user=user, query=query)
                if user:
                    session.update(username=user["username"], role=user["role"], mode=mode)
                else:
                    status = 401
            except sqlite3.Error:
                # Do not expose database exception messages or tracebacks.
                context["error"] = True
                status = 400
        return render_template("login.html", **context), status

    @app.get("/dashboard")
    def dashboard():
        if "username" not in session:
            return redirect(url_for("login", mode="vulnerable"))
        return render_template("dashboard.html", mode=session["mode"])

    @app.post("/logout")
    def logout():
        mode = session.get("mode", "vulnerable")
        session.clear()
        return redirect(url_for("login", mode=mode))

    return app


if __name__ == "__main__":
    # Local lab only. Debugger disabled; never bind this lab to a public interface.
    create_app().run(host="127.0.0.1", port=5000, debug=False)
