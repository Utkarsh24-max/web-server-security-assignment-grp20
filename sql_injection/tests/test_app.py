"""Verify the actual authentication boundary, not just the message on screen."""
import unittest

from app import create_app


class AuthenticationTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config["TESTING"] = True
        self.client = self.app.test_client()

    def login(self, mode, username, password):
        return self.client.post(f"/login/{mode}", data={"username": username, "password": password})

    def test_wrong_password_denied_on_both_paths(self):
        for mode in ("vulnerable", "secure"):
            with self.subTest(mode=mode):
                self.assertEqual(self.login(mode, "admin", "wrong").status_code, 401)
                self.assertEqual(self.client.get("/dashboard").status_code, 302)

    def test_real_credentials_work_on_both_paths(self):
        for mode in ("vulnerable", "secure"):
            for username, password in (("admin", "Admin@123"), ("student", "Student@123")):
                with self.subTest(mode=mode, username=username):
                    self.assertEqual(self.login(mode, username, password).status_code, 200)
                    self.assertEqual(self.client.get("/dashboard").status_code, 200)
                    with self.client.session_transaction() as session:
                        self.assertEqual(session["username"], username)

    def test_same_payload_bypasses_vulnerable_and_fails_secure(self):
        self.assertEqual(self.login("vulnerable", "admin' -- ", "wrong").status_code, 200)
        with self.client.session_transaction() as session:
            self.assertEqual(session["username"], "admin")
        self.assertEqual(self.client.get("/dashboard").status_code, 200)
        response = self.login("secure", "admin' -- ", "wrong")
        self.assertEqual(response.status_code, 401)
        self.assertIn(b"BOUND PARAMETERS", response.data)
        self.assertEqual(self.client.get("/dashboard").status_code, 302)

    def test_tautology_payload_has_same_boundary(self):
        payload = "' OR 1=1 -- "
        self.assertEqual(self.login("vulnerable", payload, "wrong").status_code, 200)
        self.assertEqual(self.login("secure", payload, "wrong").status_code, 401)

    def test_invalid_sql_has_no_exception_disclosure(self):
        response = self.login("vulnerable", "'", "wrong")
        self.assertEqual(response.status_code, 400)
        self.assertNotIn(b"sqlite3.OperationalError", response.data)
        self.assertEqual(self.client.get("/dashboard").status_code, 302)

    def test_input_is_html_escaped(self):
        payload = '<script>alert(1)</script>'
        response = self.login("secure", payload, "wrong")
        self.assertNotIn(payload.encode(), response.data)
        self.assertIn(b"&lt;script&gt;", response.data)

    def test_logout_revokes_dashboard_access(self):
        self.login("secure", "admin", "Admin@123")
        self.assertEqual(self.client.post("/logout").status_code, 302)
        self.assertEqual(self.client.get("/dashboard").status_code, 302)

    def test_unknown_mode_is_not_found(self):
        self.assertEqual(self.client.get("/login/unknown").status_code, 404)


if __name__ == "__main__":
    unittest.main()
