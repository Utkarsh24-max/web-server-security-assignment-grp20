# Reflected Cross-Site Scripting (Reflected XSS)

## Assignment Information


**Course:** Cyber Security (IT-30001)  
**Institute:** IIIT Allahabad  
**Member:** Nitin Kumar  
**Roll Number:** IIT2024095  
**Vulnerability:** Cross-Site Scripting (XSS)  
**Variant:** Reflected XSS

## 1. Introduction

Reflected Cross-Site Scripting (XSS) is a web security vulnerability in which malicious input received through a request is reflected directly in the server's response without proper output encoding.

When a victim's browser processes the response, the injected JavaScript may execute in the context of the trusted website.

Unlike Stored XSS, the malicious payload is not permanently stored on the server. It is reflected directly from the incoming request.

## 2. Project Overview

This project demonstrates Reflected XSS using a simple search application developed with Node.js and Express.js.

The application provides two implementations:

- **Vulnerable Version:** Directly inserts user-provided search input into the HTML response without proper encoding.
- **Secure Version:** Applies Context-Aware Output Encoding before displaying user input.

The purpose is to demonstrate the vulnerability, understand its root cause, and verify the effectiveness of the implemented mitigation.

## 3. Vulnerable Implementation

The vulnerable implementation is available at:

`GET /vulnerable`

The application receives user input through the URL query parameter using:

```javascript
const query = req.query.q || "";
```

The input is directly inserted into the HTML response:

```javascript
<p>You searched for: ${query}</p>
```

Since the input is not encoded before being rendered, malicious HTML and JavaScript can be interpreted and executed by the browser.

## 4. Working Exploit

The following payload is used to demonstrate the vulnerability in the controlled local application:

```html
<script>alert(1)</script>
```

### Steps to Reproduce

1. Open the vulnerable search page.
2. Enter the above payload in the search box.
3. Click the Search button.
4. Observe the JavaScript alert popup.

### Expected Result

The browser executes the injected JavaScript and displays an alert containing `1`.

This demonstrates that untrusted user input is being reflected into the HTML response and executed by the browser.

## 5. Root Cause

The root cause is the direct insertion of untrusted user input into the HTML response without proper output encoding.

The browser interprets the injected script as executable JavaScript instead of treating the input as plain text.

## 6. Implemented Mitigation: Context-Aware Output Encoding

To mitigate Reflected XSS, Context-Aware Output Encoding is implemented using a custom `escapeHTML()` function.

The function converts special HTML characters into their corresponding HTML entities.

### Character Encoding

| Original Character | Encoded Representation |
|---|---|
| `&` | `&amp;` |
| `<` | `&lt;` |
| `>` | `&gt;` |
| `"` | `&quot;` |
| `'` | `&#39;` |

### Implementation

```javascript
function escapeHTML(str) {
    return str.replace(/[&<>"']/g, function (char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[char];
    });
}
```

The secure endpoint uses the encoded input:

```javascript
const safeQuery = escapeHTML(query);
```

```javascript
<p>You searched for: ${safeQuery}</p>
```

This ensures that special characters are treated as text rather than executable HTML markup in the HTML text context.

## 7. Verification of Mitigation

The secure implementation is available at:

`GET /secure`

The same payload is tested in both implementations.

| Test | Vulnerable Version | Secure Version |
|---|---|---|
| Payload | `<script>alert(1)</script>` | Same payload |
| Result | JavaScript alert executes | Payload appears as normal text |
| Status | Vulnerable | Mitigation working |

The secure version successfully prevents the injected JavaScript from executing by encoding the special HTML characters before rendering the input.

## 8. Other XSS Mitigation Techniques

Apart from the implemented output encoding technique, the following alternatives are also important.

### 8.1 Framework Auto-Escaping

Modern frameworks such as React automatically escape user-provided values when rendering them as normal text.

This prevents injected HTML and JavaScript from being interpreted as executable markup.

### 8.2 HTML Sanitizer for Rich HTML

An HTML sanitizer removes dangerous tags and attributes from user-provided HTML while allowing safe HTML content when required.

It is useful when an application needs to support rich text input.

### 8.3 Content Security Policy (CSP)

CSP is a browser security mechanism that restricts which scripts can execute and where scripts can be loaded from.

It provides an additional layer of protection against script injection.

### 8.4 HttpOnly Cookies

HttpOnly is a cookie attribute that prevents JavaScript from accessing the cookie through browser APIs such as `document.cookie`.

It helps reduce the risk of session cookie theft through XSS.

### 8.5 Safe DOM Sinks

Safe DOM methods such as `textContent` should be preferred over unsafe methods such as `innerHTML` when displaying untrusted text.

`textContent` treats the supplied input as plain text instead of parsing it as HTML.

## 9. Technologies Used

- Node.js
- Express.js
- JavaScript
- HTML
- CSS

## 10. How to Run the Application

### Prerequisites

- Node.js installed
- npm installed

### Installation

Open a terminal inside the `reflected-xss` directory and execute:

```bash
npm install
```

### Start the Server

```bash
node app.js
```

The server starts at:

**http://localhost:3000**

### Application Endpoints

| Endpoint | Description |
|---|---|
| `/vulnerable` | Demonstrates Reflected XSS |
| `/secure` | Demonstrates the mitigated implementation |

Open the following URLs in your browser:

- **Vulnerable Version:** [http://localhost:3000/vulnerable](http://localhost:3000/vulnerable)
- **Secure Version:** [http://localhost:3000/secure](http://localhost:3000/secure)

## 11. Conclusion

This project demonstrates Reflected Cross-Site Scripting, its exploitation, root cause, and mitigation.

A vulnerable search application was created to demonstrate JavaScript execution through reflected user input.

Context-Aware Output Encoding was implemented to prevent the execution of injected scripts.

The same payload was tested against the secure implementation, where it was displayed as normal text instead of executing.

All demonstrations are performed in a controlled local environment for academic purposes.