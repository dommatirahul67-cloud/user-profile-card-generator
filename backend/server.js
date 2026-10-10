
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "20kb" }));

// Validate environment variables before starting the server.
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables in backend/.env");
  process.exit(1);
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Escape user input before inserting it into generated HTML.
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
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

// Accept only valid HTTP or HTTPS URLs.
function validateUrl(value, fieldName) {
  if (!value) return "";

  if (typeof value !== "string" || value.length > 2048) {
    throw new Error(`${fieldName} is invalid.`);
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${fieldName} must be a valid URL.`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error(`${fieldName} must start with http:// or https://.`);
  }

  return parsed.href;
}

// Generate the profile card HTML on the server.
function generateProfileCard(profile) {
  const name = escapeHtml(profile.name);
  const bio = escapeHtml(profile.bio);
  const skills = profile.skills
    .map((skill) => `<span class="skill">${escapeHtml(skill)}</span>`)
    .join("");

  const initials = escapeHtml(
    profile.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  );

  const avatar = profile.avatar_url
    ? `<img class="avatar" src="${escapeHtml(profile.avatar_url)}" alt="${name}'s avatar" referrerpolicy="no-referrer">`
    : `<div class="avatar avatar-placeholder" aria-label="Avatar">${initials}</div>`;

  const socialLinks = [
    ["GitHub", profile.github_url],
    ["LinkedIn", profile.linkedin_url],
    ["Portfolio", profile.portfolio_url]
  ]
    .filter(([, url]) => url)
    .map(
      ([label, url]) =>
        `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    )
    .join(" ");

  return `
    <article class="profile-card">
      <div class="profile-avatar">${avatar}</div>
      <h2>${name}</h2>
      <p class="profile-bio">${bio || "No bio added yet."}</p>
      <div class="profile-skills">${skills || "No skills added yet."}</div>
      <nav class="profile-social-links" aria-label="Social links">
        ${socialLinks}
      </nav>
      <small>Profile ID: ${profile.id}</small>
    </article>
  `;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "User Profile Card Generator API is running"
  });
});

// Create and save a profile.
app.post("/api/profiles", async (req, res) => {
  try {
    const {
      name,
      bio = "",
      skills = [],
      avatar_url = "",
      github_url = "",
      linkedin_url = "",
      portfolio_url = ""
    } = req.body || {};

    if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
      return res.status(400).json({
        error: "Name is required and must be at most 80 characters."
      });
    }

    if (typeof bio !== "string" || bio.length > 500) {
      return res.status(400).json({
        error: "Bio must be text of at most 500 characters."
      });
    }

    let normalizedSkills;

    if (Array.isArray(skills)) {
      normalizedSkills = skills;
    } else if (typeof skills === "string") {
      normalizedSkills = skills.split(",");
    } else {
      return res.status(400).json({
        error: "Skills must be a list or comma-separated text."
      });
    }

    normalizedSkills = normalizedSkills
      .map((skill) => {
        if (typeof skill !== "string") {
          throw new Error("Each skill must be text.");
        }
        return skill.trim();
      })
      .filter(Boolean);

    if (
      normalizedSkills.length > 20 ||
      normalizedSkills.some((skill) => skill.length > 40)
    ) {
      return res.status(400).json({
        error: "Provide at most 20 skills, each no longer than 40 characters."
      });
    }

    const profileData = {
      name: name.trim(),
      bio: bio.trim(),
      skills: normalizedSkills,
      avatar_url: validateUrl(avatar_url, "Avatar URL"),
      github_url: validateUrl(github_url, "GitHub URL"),
      linkedin_url: validateUrl(linkedin_url, "LinkedIn URL"),
      portfolio_url: validateUrl(portfolio_url, "Portfolio URL")
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert([profileData])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert failed:", error.message);
      return res.status(500).json({
        error: "Could not save the profile. Check the database configuration."
      });
    }

    return res.status(201).json({
      message: "Profile created successfully!",
      profile: data,
      cardHtml: generateProfileCard(data)
    });
  } catch (error) {
    return res.status(400).json({
      error: error.message || "Invalid profile details."
    });
  }
});

// Retrieve one saved profile by its numeric ID.
app.get("/api/profiles/:id", async (req, res) => {
  try {
    const id = req.params.id;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: "Invalid profile ID." });
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Supabase lookup failed:", error.message);
      return res.status(500).json({ error: "Could not retrieve the profile." });
    }

    if (!data) {
      return res.status(404).json({ error: "Profile not found." });
    }

    res.json({
      profile: data,
      cardHtml: generateProfileCard(data)
    });
  } catch (error) {
    res.status(500).json({ error: "An unexpected server error occurred." });
  }
});

// Handle invalid JSON and unexpected errors.
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && "body" in err) {
    return res.status(400).json({ error: "Invalid JSON request body." });
  }

  console.error("Server error:", err.message);
  res.status(500).json({ error: "An unexpected server error occurred." });
});

app.listen(PORT, () => {
  console.log(`Profile Card Generator API running at http://localhost:${PORT}`);
});
