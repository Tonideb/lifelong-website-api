import { PrismaClient } from "@prisma/client";
import express from "express";
import { Resend } from 'resend';
const cors = require("cors");

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

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
  const { email } = req.body;

  try {
    // Create waitlist entry with empty waitListCode and preferences
    const entry = await prisma.waitlistEntry.create({
      data: {
        email,
        waitListCode: "",
        preferences: [],
      },
    });

    // Send welcome email to the user
    await resend.emails.send({
      from: 'Life Long Club <noreply@lifelong.club>',
      to: email,
      subject: 'Welcome to Life Long Club Waitlist',
      html: `
        <div style="font-family: 'DM Mono', monospace; color: #fe240b;">
          <h2>Welcome to Life Long Club!</h2>
          <p>Thank you for joining our waitlist. We're excited to have you on board.</p>
          <p>We'll keep you updated on our latest developments and let you know when we're ready to launch.</p>
          <p>Stay tuned!</p>
          <br/>
          <p>Best regards,</p>
          <p>The Life Long Club Team</p>
        </div>
      `,
    });

    // Send notification to business email
    await resend.emails.send({
      from: 'Life Long Club <noreply@lifelong.club>',
      to: 'source.sensei1205@gmail.com',
      subject: 'New Waitlist Signup',
      html: `
        <div style="font-family: 'DM Mono', monospace; color: #fe240b;">
          <h2>New Waitlist Signup</h2>
          <p>A new user has joined the waitlist:</p>
          <p>Email: ${email}</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `,
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
