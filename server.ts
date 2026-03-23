import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // GitHub OAuth Routes
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;
    const redirectUri = `${appUrl}/auth/github/callback`;
    
    if (!clientId) {
      return res.status(500).json({ error: "GITHUB_CLIENT_ID not configured" });
    }

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user,repo`;
    res.json({ url: githubAuthUrl });
  });

  app.get("/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!code) {
      return res.status(400).send("No code provided");
    }

    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      const accessToken = response.data.access_token;

      if (!accessToken) {
        return res.status(400).send("Failed to obtain access token");
      }

      // In a real app, you'd store the token in a session or database.
      // For this demo, we'll send it back to the client via postMessage.
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GITHUB_AUTH_SUCCESS', token: '${accessToken}' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/github/user", async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No authorization header" });
    }

    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: authHeader,
        },
      });
      res.json(response.data);
    } catch (error) {
      console.error("GitHub API error:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
