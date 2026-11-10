# Web Server Security Assignment – Group 20

**Indian Institute of Information Technology Allahabad**

**Department of Information Technology**

**Course:** Cyber Security (IT-30001)  
**Semester:** Autumn 2026  
**Assignment:** Exploitation and Mitigation of Web Server Vulnerabilities

## Project Overview

This repository contains our group's implementation and demonstration of four web server vulnerability categories.

Each group member independently implements one vulnerability variant, demonstrates its exploitation in a controlled local environment, and implements a mitigation.

## Team Contributions and Ownership

| Member | Roll Number | Vulnerability | Variant |
|---|---|---|---|
| Member 1 | Add roll number | CSRF | GET-based forged action |
| Member 2 | Add roll number | SQL Injection | To be updated |
| Member 3 | Add roll number | OS Command Injection | To be updated |
| Member 4 | Add roll number | Cross-Site Scripting (XSS) | To be updated |

## Project Structure

- `csrf/` – GET-based CSRF demonstration and mitigation.
- `sql-injection/` – SQL Injection implementation.
- `command-injection/` – OS Command Injection implementation.
- `xss/` – Cross-Site Scripting implementation.

## Individual Implementations

### 1. Cross-Site Request Forgery (CSRF)

**Member:** Member 1  
**Variant:** GET-based forged action

Demonstrates:
- Vulnerable state-changing GET request.
- Forged cross-origin request using an authenticated browser session.
- Mitigation using POST requests and synchronizer CSRF tokens.
- HTTP 405 rejection of state-changing GET requests.

Implementation: [`csrf/`](./csrf/)

### 2. SQL Injection

To be added.

### 3. OS Command Injection

To be added.

### 4. Cross-Site Scripting (XSS)

To be added.

## Running Individual Projects

Refer to the README inside each vulnerability folder for dependencies, setup instructions, execution commands and demonstration steps.

## Academic Integrity and Testing Scope

All demonstrations are performed against applications developed by our group in controlled local environments. No external websites or shared infrastructure are targeted.
