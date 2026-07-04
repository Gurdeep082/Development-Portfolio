const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const ContactMessage = require("./models/ContactMessage");
const Project = require("./models/Project");
const SiteSettings = require("./models/SiteSettings");

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI;
const adminKey = process.env.ADMIN_KEY;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
  })
);
app.use(express.json({ limit: "10mb" }));
app.use("/api", (_, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

let isMongoConnected = false;
const adminEventClients = new Set();

const broadcastAdminEvent = (type, payload) => {
  const event = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  adminEventClients.forEach((client) => client.write(event));
};

const connectMongo = async () => {
  if (!mongoUri) {
    console.warn("MONGODB_URI not configured. Contact messages will not be persisted.");
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    isMongoConnected = true;
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
  }
};

const requireDatabase = (_, res, next) => {
  if (!isMongoConnected) {
    return res.status(503).json({ message: "Database is temporarily unavailable." });
  }
  return next();
};

const requireAdmin = (req, res, next) => {
  if (!adminKey) {
    return res.status(503).json({
      message: "ADMIN_KEY is not configured on the server.",
    });
  }
  if (req.get("x-admin-key") !== adminKey) {
    return res.status(401).json({ message: "Invalid admin key." });
  }
  return next();
};

app.get("/api/health", (_, res) => {
  res.status(200).json({
    ok: true,
    mongoConnected: isMongoConnected,
  });
});

app.get("/api/admin/events", (req, res) => {
  if (!adminKey || req.query.key !== adminKey) {
    return res.status(401).json({ message: "Invalid admin key." });
  }

  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();
  res.write("event: connected\ndata: {}\n\n");
  adminEventClients.add(res);

  const heartbeat = setInterval(() => {
    res.write(": keep-alive\n\n");
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    adminEventClients.delete(res);
  });
});

app.get("/api/projects", async (_, res) => {
  if (!isMongoConnected) return res.status(200).json([]);

  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    return res.status(200).json(projects);
  } catch (error) {
    console.error("Failed to load projects:", error.message);
    return res.status(500).json({ message: "Could not load projects." });
  }
});

app.get("/api/settings", async (_, res) => {
  if (!isMongoConnected) {
    return res.status(200).json({ resume: "", resumeName: "" });
  }

  try {
    const settings = await SiteSettings.findOne({ key: "portfolio" });
    return res.status(200).json({
      resume: settings?.resume || "",
      resumeName: settings?.resumeName || "",
    });
  } catch (error) {
    console.error("Failed to load settings:", error.message);
    return res.status(500).json({ message: "Could not load site settings." });
  }
});

app.post("/api/visits", async (_, res) => {
  if (!isMongoConnected) {
    return res.status(503).json({ message: "Visit counter is temporarily unavailable." });
  }

  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "portfolio" },
      {
        $setOnInsert: {
          key: "portfolio",
          resume: "",
          resumeName: "resume.pdf",
        },
        $inc: { visitCount: 1 },
      },
      { upsert: true, new: true, runValidators: true }
    );

    broadcastAdminEvent("visit", { visitCount: settings.visitCount });
    return res.status(200).json({ visitCount: settings.visitCount });
  } catch (error) {
    console.error("Failed to count visit:", error.message);
    return res.status(500).json({ message: "Could not count visit." });
  }
});

app.post("/api/contact", async (req, res) => {
  const { fullName, email, company, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({
      message: "Full name, email, and message are required.",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Please provide a valid email address." });
  }

  if (!isMongoConnected) {
    return res.status(503).json({
      message: "Service is temporarily unavailable. Please try again shortly.",
    });
  }

  try {
    const contact = await ContactMessage.create({
      fullName,
      email,
      company,
      message,
    });

    broadcastAdminEvent("message-created", contact.toObject());
    return res.status(201).json({
      message: "Message sent successfully. I will get back to you soon.",
      id: contact._id,
    });
  } catch (error) {
    console.error("Failed to save contact message:", error.message);
    return res.status(500).json({
      message: "Could not send your message. Please try again.",
    });
  }
});

app.get("/api/admin/dashboard", requireAdmin, requireDatabase, async (_, res) => {
  try {
    const [projects, messages, settings] = await Promise.all([
      Project.find().sort({ createdAt: -1 }),
      ContactMessage.find().sort({ createdAt: -1 }),
      SiteSettings.findOne({ key: "portfolio" }),
    ]);

    return res.status(200).json({
      projects,
      messages,
      settings: {
        resume: settings?.resume || "",
        resumeName: settings?.resumeName || "",
        visitCount: settings?.visitCount || 0,
      },
    });
  } catch (error) {
    console.error("Failed to load admin dashboard:", error.message);
    return res.status(500).json({ message: "Could not load dashboard." });
  }
});
app.put("/api/admin/reset-visits", requireAdmin, requireDatabase, async (_, res) => {
  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "portfolio" },
      { $set: { visitCount: 0 } },
      { new: true, upsert: true }
    );

    broadcastAdminEvent("visit", {
      visitCount: 0,
    });

    return res.status(200).json({
      message: "Visit count reset.",
      visitCount: 0,
    });
  } catch (error) {
    console.error("Failed to reset visit count:", error.message);
    return res.status(500).json({
      message: "Could not reset visit count.",
    });
  }
});


app.post("/api/admin/projects", requireAdmin, requireDatabase, async (req, res) => {
  const { title, description, stack, link, images } = req.body;

  if (
    !title ||
    !description ||
    !link ||
    !Array.isArray(images) ||
    images.length === 0
  ) {
    return res.status(400).json({
      message: "Title, description, project link, and at least one image are required.",
    });
  }

  try {
    const project = await Project.create({
      title,
      description,
      stack,
      link,
      images,
    });

    broadcastAdminEvent("project-created", project.toObject());

    return res.status(201).json(project);
  } catch (error) {
    console.error("Failed to create project:", error);
    return res.status(500).json({
      message: "Could not create project.",
    });
  }
});
app.delete("/api/admin/projects/:id", requireAdmin, requireDatabase, async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) return res.status(404).json({ message: "Project not found." });
    broadcastAdminEvent("project-deleted", { id: project._id.toString() });
    return res.status(200).json({ message: "Project deleted." });
  } catch (error) {
    return res.status(400).json({ message: "Invalid project id." });
  }
});

app.put("/api/admin/resume", requireAdmin, requireDatabase, async (req, res) => {
  const { resume, resumeName } = req.body;
  if (!resume || !resume.startsWith("data:application/pdf")) {
    return res.status(400).json({ message: "Please upload a valid PDF resume." });
  }

  try {
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "portfolio" },
      { key: "portfolio", resume, resumeName: resumeName || "resume.pdf" },
      { upsert: true, new: true, runValidators: true }
    );
    broadcastAdminEvent("resume-updated", {
      resumeName: settings.resumeName,
    });
    return res.status(200).json({
      message: "Resume updated.",
      resumeName: settings.resumeName,
    });
  } catch (error) {
    console.error("Failed to update resume:", error.message);
    return res.status(500).json({ message: "Could not update resume." });
  }
});

app.delete("/api/admin/messages/:id", requireAdmin, requireDatabase, async (req, res) => {
  try {
    const message = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found." });
    broadcastAdminEvent("message-deleted", { id: message._id.toString() });
    return res.status(200).json({ message: "Message deleted." });
  } catch (error) {
    return res.status(400).json({ message: "Invalid message id." });
  }
});

app.listen(port, async () => {
  await connectMongo();
  console.log(`Server running at http://localhost:${port}`);
});
