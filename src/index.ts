import { PrismaClient } from "@prisma/client";
import express from "express";
const cors = require("cors");

const prisma = new PrismaClient();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.options("*", cors());
app.use(express.json());
app.use(express.raw({ type: "application/vnd.custom-type" }));
app.use(express.text({ type: "text/html" }));

// Waitlist Endpoints

// Create new waitlist entry
app.post("/waitlist", async (req, res) => {
  const { email, waitListCode, preferences } = req.body;

  try {
    const entry = await prisma.waitlistEntry.create({
      data: {
        email,
        waitListCode,
        preferences,
      },
    });

    return res.json(entry);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create waitlist entry" });
  }
});

// Get all waitlist entries
app.get("/waitlist", async (req, res) => {
  const entries = await prisma.waitlistEntry.findMany({
    orderBy: { createdAt: "desc" },
  });

  res.json(entries);
});

// Get specific waitlist entry by ID
app.get("/waitlist/:id", async (req, res) => {
  const id = req.params.id;
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id },
  });

  return res.json(entry);
});

// Delete waitlist entry by ID
app.delete("/waitlist/:id", async (req, res) => {
  const id = req.params.id;
  await prisma.waitlistEntry.delete({
    where: { id },
  });

  return res.send({ status: "ok" });
});

// Home route with documentation
app.get("/", async (req, res) => {
  res.send(
    `
    <h1>Marketplace API</h1>
    <h2>Available Routes</h2>
    <pre>
      GET, POST /waitlist
      GET, DELETE /waitlist/:id
    </pre>
    `.trim()
  );
});

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Marketplace API listening at http://localhost:${port}`);
});
