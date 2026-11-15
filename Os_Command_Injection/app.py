"""Local OS Command Injection Demonstration Lab."""

from html import escape
from http.server import BaseHTTPRequestHandler, HTTPServer
from subprocess import run
from urllib.parse import parse_qs, urlparse
import sys

SERVER_HOST = "127.0.0.1"
SERVER_PORT = 8000
MAX_INPUT_LIMIT = 200


def vulnerable_command(message: str) -> str:
    """Unsafe execution: input string is concatenated directly into the shell command."""
    command = f"echo {message}"
    result = run(
        command,
        shell=True,
        capture_output=True,
        text=True,
        timeout=5,
        check=True,
    )
    return result.stdout.strip()


def safe_command(message: str) -> str:
    """Safe execution: input is supplied as a distinct argument without shell interpretation."""
    args = [sys.executable, "-c", "import sys; print(sys.argv[1])", message]
    result = run(
        args,
        shell=False,
        capture_output=True,
        text=True,
        timeout=5,
        check=True,
    )
    return result.stdout.strip()


class LabRequestHandler(BaseHTTPRequestHandler):
    def do_GET(self) -> None:
        parsed_url = urlparse(self.path)
        params = parse_qs(parsed_url.query, keep_blank_values=True)

        if parsed_url.path not in ("/", "/vulnerable", "/safe"):
            self._respond(404, "Requested endpoint not found.", "", "", "")
            return

        if parsed_url.path == "/":
            self._respond(200, "Enter an input above and submit to see the execution result.", "", "", "")
            return

        user_input = params.get("text", [""])[0]
        if len(user_input) > MAX_INPUT_LIMIT:
            self._respond(400, f"Input exceeds maximum allowed limit of {MAX_INPUT_LIMIT} characters.", "", "", "")
            return

        is_vuln = (parsed_url.path == "/vulnerable")
        runner = vulnerable_command if is_vuln else safe_command
        output = runner(user_input)

        vuln_val = user_input if is_vuln else ""
        safe_val = "" if is_vuln else user_input
        active_source = "Vulnerable Path (/vulnerable)" if is_vuln else "Mitigated Path (/safe)"

        self._respond(200, output, vuln_val, safe_val, active_source)

    def log_message(self, format_str: str, *args: object) -> None:
        print(f"{self.address_string()} - {format_str % args}")

    def _respond(
        self,
        status: int,
        message: str,
        vuln_val: str = "",
        safe_val: str = "",
        active_source: str = "",
    ) -> None:
        html_page = self._build_page(message, status, vuln_val, safe_val, active_source)
        encoded_content = html_page.encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded_content)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(encoded_content)

    @staticmethod
    def _build_page(
        message: str,
        status: int,
        vuln_val: str = "",
        safe_val: str = "",
        active_source: str = "",
    ) -> str:
        source_badge = ""
        if active_source:
            badge_class = "vuln-source" if "Vulnerable" in active_source else "safe-source"
            source_badge = f'<span class="source-tag {badge_class}">{escape(active_source)}</span>'

        result_section = f"""<section class="result-box">
      <div class="result-header">
        <div class="result-title-group">
          <h2>Execution Result</h2>
          {source_badge}
        </div>
        <span class="status-code">HTTP {status}</span>
      </div>
      <pre>{escape(message)}</pre>
    </section>"""

        return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>OS Command Injection Analysis Lab</title>
<style>
  :root {{
    color-scheme: light;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    color: #1a202c;
    background: #f4f6fa;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    min-height: 100vh;
    margin: 0;
    padding: 40px 20px;
    background: #f4f6fa;
  }}
  main {{ width: min(100%, 880px); margin: 0 auto; }}
  .header-section {{ margin-bottom: 24px; }}
  .tagline {{
    margin: 0 0 8px;
    color: #2b6cb0;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }}
  h1 {{ margin: 0; font-size: 2.2rem; color: #1a202c; }}
  .description {{ margin: 10px 0 0; color: #4a5568; line-height: 1.6; font-size: 0.98rem; }}
  .alert-box {{
    margin-top: 18px;
    padding: 12px 16px;
    border: 1px solid #cbd5e0;
    border-radius: 8px;
    background: #ebf8ff;
    color: #2c5282;
    font-size: 0.9rem;
    line-height: 1.5;
  }}
  .cards-container {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }}
  .card {{
    padding: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  }}
  .card.vulnerable {{ border-top: 4px solid #e53e3e; }}
  .card.safe {{ border-top: 4px solid #2f855a; }}
  .card-badge {{
    display: inline-block;
    margin-bottom: 12px;
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }}
  .vulnerable .card-badge {{ background: #fff5f5; color: #c53030; }}
  .safe .card-badge {{ background: #f0fff4; color: #276749; }}
  h2 {{ margin: 0; font-size: 1.25rem; }}
  .card p {{ min-height: 48px; margin: 8px 0 18px; color: #718096; font-size: 0.92rem; line-height: 1.5; }}
  label {{ display: block; margin-bottom: 6px; font-size: 0.85rem; font-weight: 600; color: #2d3748; }}
  input {{
    width: 100%;
    min-height: 42px;
    padding: 10px 12px;
    border: 1px solid #cbd5e0;
    border-radius: 6px;
    background: #ffffff;
    color: #1a202c;
    font-size: 0.92rem;
  }}
  input:focus {{ outline: 2px solid #bee3f8; border-color: #3182ce; }}
  button {{
    width: 100%;
    min-height: 42px;
    margin-top: 14px;
    border: 0;
    border-radius: 6px;
    background: #2d3748;
    color: #ffffff;
    font-size: 0.92rem;
    font-weight: 600;
    cursor: pointer;
  }}
  .vulnerable button {{ background: #c53030; }}
  .safe button {{ background: #276749; }}
  button:hover {{ opacity: 0.92; }}
  .result-box {{
    margin-top: 24px;
    padding: 18px 20px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    background: #ffffff;
  }}
  .result-header {{ display: flex; align-items: center; justify-content: space-between; gap: 12px; }}
  .result-title-group {{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }}
  .result-header h2 {{ font-size: 1.05rem; }}
  .source-tag {{
    display: inline-block;
    padding: 3px 8px;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 700;
  }}
  .vuln-source {{ background: #fff5f5; color: #c53030; border: 1px solid #fed7d7; }}
  .safe-source {{ background: #f0fff4; color: #276749; border: 1px solid #c6f6d5; }}
  .status-code {{ color: #718096; font-size: 0.85rem; font-weight: 600; }}
  pre {{
    margin: 12px 0 0;
    padding: 14px;
    border-radius: 6px;
    background: #edf2f7;
    color: #2d3748;
    font-family: Consolas, "Courier New", monospace;
    font-size: 0.92rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }}
  footer {{ margin-top: 28px; color: #a0aec0; font-size: 0.82rem; text-align: center; }}
  @media (max-width: 650px) {{
    .cards-container {{ grid-template-columns: 1fr; }}
    .card p {{ min-height: 0; }}
  }}
</style>
</head>
<body>
  <main>
    <header class="header-section">
      <p class="tagline">Security Laboratory · In-Band Command Injection</p>
      <h1>OS Command Injection Analysis</h1>
      <p class="description">Compare standard command execution with parameterized argument execution. Submit an identical test string (e.g., <code>hello & echo INJECTED</code>) to both implementations to observe the behavioral difference.</p>
      <div class="alert-box">
        <strong>Notice:</strong> This application executes locally on 127.0.0.1 for educational testing. Do not expose this service over external network interfaces.
      </div>
    </header>

    <section class="cards-container">
      <!-- Vulnerable Implementation -->
      <article class="card vulnerable">
        <span class="card-badge">Vulnerable Path</span>
        <h2>Shell Interpretation</h2>
        <p>User input is directly appended into a shell command string. Metacharacters like <code>&</code> are parsed as syntax, triggering secondary commands.</p>
        <form action="/vulnerable" method="get">
          <label for="vuln-text">Input string</label>
          <input id="vuln-text" name="text" maxlength="{MAX_INPUT_LIMIT}" placeholder="e.g. hello & echo INJECTED" value="{escape(vuln_val)}" autocomplete="off" required>
          <button type="submit">Run Vulnerable Path</button>
        </form>
      </article>

      <!-- Mitigated Implementation -->
      <article class="card safe">
        <span class="card-badge">Mitigated Path</span>
        <h2>Argument Vector</h2>
        <p>User input is passed strictly as a discrete data element without shell invocation (<code>shell=False</code>). Metacharacters are not interpreted.</p>
        <form action="/safe" method="get">
          <label for="safe-text">Input string</label>
          <input id="safe-text" name="text" maxlength="{MAX_INPUT_LIMIT}" placeholder="e.g. hello & echo INJECTED" value="{escape(safe_val)}" autocomplete="off" required>
          <button type="submit">Run Mitigated Path</button>
        </form>
      </article>
    </section>

    {result_section}

    <footer>Educational Demonstration · Computer Science & Security Analysis</footer>
  </main>
</body>
</html>"""


def start_server() -> None:
    server_address = (SERVER_HOST, SERVER_PORT)
    server = HTTPServer(server_address, LabRequestHandler)
    print(f"Server started at http://{SERVER_HOST}:{SERVER_PORT}/")
    print("Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()


if __name__ == "__main__":
    start_server()
