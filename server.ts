import express from "express";
import { createServer as createViteServer } from "vite";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import Database from "better-sqlite3";

dotenv.config();

const db = new Database("portfolios.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS portfolios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId TEXT,
    slug TEXT UNIQUE,
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // Portfolio API
  app.post("/api/portfolios", (req, res) => {
    const userCookie = req.cookies.user;
    const user = userCookie ? JSON.parse(userCookie) : { id: 'anonymous' };
    const { slug, data } = req.body;

    if (!slug || !data) return res.status(400).json({ error: "Missing slug or data" });

    try {
      const stmt = db.prepare("INSERT INTO portfolios (userId, slug, data) VALUES (?, ?, ?)");
      stmt.run(user.id, slug, JSON.stringify(data));
      res.json({ success: true, slug });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: "Slug already taken" });
      } else {
        res.status(500).json({ error: "Database error" });
      }
    }
  });

  app.get("/api/portfolios/:slug", (req, res) => {
    const { slug } = req.params;
    const stmt = db.prepare("SELECT data FROM portfolios WHERE slug = ?");
    const row = stmt.get(slug) as { data: string } | undefined;

    if (row) {
      res.json(JSON.parse(row.data));
    } else {
      res.status(404).json({ error: "Portfolio not found" });
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
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
