# PS-10 — Multi-Agent Autonomous Web & API Environment Explorer

This version is **100% browser-based** and is designed to run directly on **GitHub Pages**.

## How it works

User Goal → Planner Agent → Web Agent + API Agent → Analyst Agent → Final Report

- **Planner Agent:** creates the execution plan in JavaScript.
- **Web Agent:** searches Wikipedia using its public API.
- **API Agent:** searches GitHub's public REST API.
- **Analyst Agent:** combines the returned results and creates a report.
- No Python, Streamlit, server, or API key is required.

## GitHub Pages deployment

1. Upload `index.html`, `style.css`, and `script.js` to your GitHub repository root.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select `main` and `/ (root)`.
5. Save.
6. Open the generated `https://USERNAME.github.io/REPOSITORY/` URL.

## Important

This is a browser-only hackathon demo. It uses public APIs and depends on browser/network access. GitHub API rate limits may apply.

## Suggested demo

Try:
- `Find information about Python`
- `Explore GitHub repositories for AI`
- `Search Wikipedia for blockchain`
