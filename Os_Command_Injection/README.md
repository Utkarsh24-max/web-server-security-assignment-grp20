# Web Server Security: OS Command Injection (In-Band)

**Course:** Cyber Security (IT-30001) — Autumn Semester 2026  
**Department:** Department of Information Technology  
**Institution:** Indian Institute of Information Technology Allahabad (IIITA)  
**Instructor:** Dr. Soumyadev Maity  

---

## Ownership Declaration

Replace the placeholders before submission; do not leave them as-is.

| Member name | Roll number | Category | Variant implemented |
| :--- | :--- | :--- | :--- |
| Ravindra | IIT2024056 | OS command injection | Variant 1: In-band (command output returned) |

---

## Project Overview

This repository contains an academic demonstration of **OS Command Injection (In-Band / Command Output Returned)** developed for the Web Server Security assignment. 

The lab provides an interactive side-by-side comparison between:
1. **An intentionally vulnerable endpoint (`/vulnerable`)**: Demonstrates how unsanitized user input concatenated into an OS shell command leads to command injection and arbitrary command execution.
2. **A secured, mitigated endpoint (`/safe`)**: Demonstrates mitigation through parameterized argument vector execution with shell invocation disabled (`shell=False`).

> **Security & Scope Notice:** This application binds strictly to the local loopback address (`127.0.0.1:8000`) and uses harmless demonstration payloads (`echo`). It is strictly intended for local authorized educational testing.

---

## How to Run the Application

The application is built entirely using the Python 3 standard library (`http.server`, `subprocess`, `urllib.parse`); no third-party packages or virtual environment installations are required.

### 1. Start the Web Server

From this directory, open your terminal (PowerShell / Command Prompt) and run:

```powershell
python app.py
```
*(If `python` is not registered in your PATH, use the Python launcher: `py app.py`)*

The server will initialize at:
 **`http://127.0.0.1:8000/`**

To terminate the server, press `Ctrl + C` in the terminal.

---

## Verify the Behaviour (Automated Unit Tests)

Automated tests are implemented in `test_app.py` using Python's `unittest` framework to mathematically verify both the exploitability of the vulnerable variant and the efficacy of the mitigation.

### With the virtual environment active:
```powershell
python -m unittest -v
```

### On Windows without activation:
```powershell
py -m unittest -v
```
*(Or invoke via the virtual environment interpreter: `.venv\Scripts\python.exe -m unittest discover -s tests -v` if arranged into a tests directory).*

**Expected Test Output:**
```text
test_safe_variant_treats_same_payload_as_literal_data (test_app.CommandInjectionLabTests) ... 
[PASS] Safe variant treated payload as literal text data.
ok
test_vulnerable_variant_runs_harmless_injected_echo (test_app.CommandInjectionLabTests) ... 
[PASS] Vulnerable variant executed the injected command successfully.
ok

----------------------------------------------------------------------
Ran 2 tests in 0.082s

OK
```

---

## Technical Analysis & Evaluation Requirements (Table 2)

### (a) Vulnerable Implementation
In `app.py`, the `vulnerable_command()` function constructs an operating-system command string by directly interpolating untrusted user input into an `echo` statement:

```python
def vulnerable_command(message: str) -> str:
    command = f"echo {message}"
    result = run(
        command,
        shell=True,          # Invokes system shell (cmd.exe on Windows / sh on Linux)
        capture_output=True,
        text=True,
        timeout=5,
        check=True,
    )
    return result.stdout.strip()
```
Because `shell=True` is enabled, the entire concatenated string is passed directly to the operating system's command interpreter (`cmd.exe`).

### (b) Working Exploit

#### 1. Primary Teaching & Verification Payload
* **Input:**
  ```text
  hello & echo INJECTED
  ```
* **Shell Parsing:** `echo hello & echo INJECTED`
* **In-Band Output Evidence:**
  The server captures both standard outputs and transmits them directly within the HTTP 200 response:
  ```text
  hello
  INJECTED
  ```

#### 2. System Reconnaissance Exploits (`whoami`, `hostname`, `dir`)
Because the shell parses arbitrary metacharacters without restriction, an attacker can execute real operating-system reconnaissance utilities:

| Exploit Goal | Injected Payload | Shell Interpretation | In-Band Result / Evidence |
| :--- | :--- | :--- | :--- |
| **User Identification** | `test & whoami` | `echo test & whoami` | Displays current OS user/privilege domain (e.g., `WORKSTATION\username`). |
| **Host Discovery** | `test & hostname` | `echo test & hostname` | Returns the host system name on the local network. |
| **Directory Enumeration** | `test & dir` | `echo test & dir` | Lists server directory structure (`app.py`, `test_app.py`, etc.). |

---

### (c) Root Cause
The vulnerability arises from the **failure to separate code (command instructions) from untrusted data (user input)**. By passing raw user input to a shell interpreter (`shell=True`), shell metacharacters (such as `&`, `|`, `;`) are interpreted as control syntax rather than literal text data.

### (d) Mitigation Implemented
The fix is implemented in `safe_command()`, which employs **Parameterized Process Execution (Argument Vector)** with shell execution disabled:

```python
def safe_command(message: str) -> str:
    args = [sys.executable, "-c", "import sys; print(sys.argv[1])", message]
    result = run(
        args,
        shell=False,         # Direct process execution; no shell parsing occurs
        capture_output=True,
        text=True,
        timeout=5,
        check=True,
    )
    return result.stdout.strip()
```
* **Why it works:** By using `shell=False` and supplying arguments as a discrete list (`argv`), the operating system kernel spawns the executable directly via `CreateProcessW()`. The entire input string is treated strictly as data in `sys.argv[1]`.
* **Output on Mitigation (All Exploits Neutralised):**
  * Input `hello & echo INJECTED` ➔ Output: `hello & echo INJECTED` *(Literal text printed; injected echo not executed)*
  * Input `test & whoami` ➔ Output: `test & whoami` *(User identity remains protected; command does not run)*
  * Input `test & hostname` ➔ Output: `test & hostname` *(Hostname is not revealed)*
  * Input `test & dir` ➔ Output: `test & dir` *(File listing is not exposed)*

In all cases, the appended command is completely neutralised and rendered verbatim as literal data.

### (e) Other Mitigations (Theory)
As covered in lecture slides, alternative defense mechanisms include:

1. **Avoid Shell Invocation (Native APIs):**
   Whenever system operations (file handling, directory management, networking) are required, utilize built-in programming language APIs (e.g., `os.remove`, `pathlib`, `socket`) rather than invoking underlying OS shell utilities. This eliminates command interpreters from the execution path entirely.
2. **Input Validation with Strict Allow-Lists:**
   Enforce strict input validation using regular expression allow-listing (e.g., `^[a-zA-Z0-9 ]+$`). Inputs containing special shell metacharacters (`&`, `;`, `|`, `$`, `>`, `<`) are rejected before execution. *(Note: Validation should serve as a defense-in-depth layer rather than a substitute for parameterized execution).*
3. **Input Sanitization and Metacharacter Escaping:**
   Neutralize shell metacharacters by escaping them (e.g., prefixing with `^` in Windows CMD or using `shlex.quote()` in POSIX shells) to ensure they are parsed as literal characters.
4. **Principle of Least Privilege:**
   Run the web server process under a restricted, low-privilege service account with minimal filesystem and execution rights. While this does not prevent injection, it limits the blast radius of an exploit (e.g., prevents privilege escalation and unauthorized modifications).

---




