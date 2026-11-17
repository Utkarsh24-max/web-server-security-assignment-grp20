const express = require("express");
const app = express();

const sharedStyles = `
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        body {
            background-color: #f4f6f9;
            color: #1f2937;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            background: #ffffff;
            width: 100%;
            max-width: 540px;
            padding: 32px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        }
        .badge {
            display: inline-block;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 600;
            border-radius: 20px;
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-vuln {
            background-color: #fee2e2;
            color: #b91c1c;
        }
        .badge-sec {
            background-color: #dcfce7;
            color: #15803d;
        }
        h1 {
            font-size: 24px;
            margin-bottom: 20px;
            color: #111827;
        }
        form {
            display: flex;
            gap: 10px;
            margin-bottom: 28px;
        }
        input[type="text"] {
            flex: 1;
            padding: 12px 14px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 15px;
            outline: none;
            transition: border-color 0.2s;
        }
        input[type="text"]:focus {
            border-color: #2563eb;
        }
        button {
            padding: 12px 20px;
            background-color: #2563eb;
            color: #ffffff;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        button:hover {
            background-color: #1d4ed8;
        }
        .results-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
        }
        .results-box h2 {
            font-size: 14px;
            text-transform: uppercase;
            color: #6b7280;
            margin-bottom: 8px;
            letter-spacing: 0.5px;
        }
        .results-box p {
            font-size: 16px;
            word-break: break-word;
            color: #111827;
        }
        .nav-links {
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        .nav-links a {
            color: #2563eb;
            text-decoration: none;
            font-weight: 500;
        }
        .nav-links a:hover {
            text-decoration: underline;
        }
    </style>
`;

// Helper function for HTML entity encoding
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

app.get("/", (req, res) => {
    res.redirect("/vulnerable");
});

app.get("/vulnerable", (req, res) => {
    const query = req.query.q || "";

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Vulnerable Search - Reflected XSS</title>
            ${sharedStyles}
        </head>
        <body>
            <div class="container">
                <span class="badge badge-vuln">Vulnerable Version</span>
                <h1>MySearch Website</h1>

                <form action="/vulnerable" method="GET">
                    <input
                        type="text"
                        name="q"
                        placeholder="Enter your search..."
                    />
                    <button type="submit">Search</button>
                </form>

                <div class="results-box">
                    <h2>Search Results</h2>
                    <p>You searched for: ${query}</p>
                </div>

                <div class="nav-links">
                    <span>Current: <strong>/vulnerable</strong></span>
                    <a href="/secure">Switch to Secure Version &rarr;</a>
                </div>
            </div>
        </body>
        </html>
    `;

    res.send(html);
});

app.get("/secure", (req, res) => {
    const query = typeof req.query.q === "string" ? req.query.q : "";

    const safeQuery = escapeHTML(query);

    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Secure Search - XSS Mitigated</title>
            ${sharedStyles}
        </head>
        <body>
            <div class="container">
                <span class="badge badge-sec">Secure Version (Mitigated)</span>
                <h1>MySearch Website</h1>

                <form action="/secure" method="GET">
                    <input
                        type="text"
                        name="q"
                        placeholder="Enter your search..."
                    />
                    <button type="submit">Search</button>
                </form>

                <div class="results-box">
                    <h2>Search Results</h2>
                    <p>You searched for: ${safeQuery}</p>
                </div>

                <div class="nav-links">
                    <a href="/vulnerable">&larr; Back to Vulnerable Version</a>
                    <span>Current: <strong>/secure</strong></span>
                </div>
            </div>
        </body>
        </html>
    `;

    res.send(html);
});

app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});