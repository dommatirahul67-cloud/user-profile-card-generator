
const API_URL = "http://localhost:5000/api";

const form = document.getElementById("profileForm");
const submitButton = document.getElementById("submitButton");
const formMessage = document.getElementById("formMessage");

const nameInput = document.getElementById("name");
const bioInput = document.getElementById("bio");
const skillsInput = document.getElementById("skills");
const avatarInput = document.getElementById("avatarUrl");
const githubInput = document.getElementById("github");
const linkedinInput = document.getElementById("linkedin");
const portfolioInput = document.getElementById("portfolio");

const previewInitials = document.getElementById("previewInitials");
const previewName = document.getElementById("previewName");
const previewBio = document.getElementById("previewBio");
const previewSkills = document.getElementById("previewSkills");
const previewSocials = document.getElementById("previewSocials");
const savedProfile = document.getElementById("savedProfile");

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "YN";
}

function parseSkills(value) {
  return value
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);
}

function safeUrl(value) {
  if (!value.trim()) return "";

  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function createSocialLink(label, value) {
  const url = safeUrl(value);

  if (!url) return null;

  const link = document.createElement("a");
  link.href = url;
  link.textContent = label;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  return link;
}

function updatePreview() {
  const name = nameInput.value.trim();
  const bio = bioInput.value.trim();
  const skills = parseSkills(skillsInput.value);
  const avatarUrl = safeUrl(avatarInput.value);

  previewName.textContent = name || "Your Name";
  previewBio.textContent =
    bio || "Your story begins here. Add a bio to introduce yourself.";

  previewInitials.textContent = getInitials(name);

  // Replace the initials with an image only when a valid URL is provided.
  const avatarWrap = document.querySelector(".avatar-wrap");
  let avatarImage = document.getElementById("previewAvatarImage");

  if (avatarUrl) {
    if (!avatarImage) {
      avatarImage = document.createElement("img");
      avatarImage.id = "previewAvatarImage";
      avatarImage.className = "profile-avatar-image";
      avatarImage.alt = "Profile avatar";
      avatarImage.onerror = () => {
        avatarImage.hidden = true;
        previewInitials.hidden = false;
      };
      avatarWrap.appendChild(avatarImage);
    }

    if (avatarImage.src !== avatarUrl) {
      avatarImage.src = avatarUrl;
    }

    avatarImage.hidden = false;
    previewInitials.hidden = true;
  } else {
    if (avatarImage) {
      avatarImage.hidden = true;
    }
    previewInitials.hidden = false;
  }

  previewSkills.replaceChildren();

  if (skills.length) {
    skills.slice(0, 20).forEach((skill) => {
      const chip = document.createElement("span");
      chip.className = "skill-chip";
      chip.textContent = skill;
      previewSkills.appendChild(chip);
    });
  } else {
    const chip = document.createElement("span");
    chip.className = "skill-chip";
    chip.textContent = "Your skills";
    previewSkills.appendChild(chip);
  }

  previewSocials.replaceChildren();

  const links = [
    ["GitHub", githubInput.value],
    ["LinkedIn", linkedinInput.value],
    ["Portfolio", portfolioInput.value]
  ];

  let count = 0;

  links.forEach(([label, value]) => {
    const link = createSocialLink(label, value);

    if (link) {
      previewSocials.appendChild(link);
      count++;
    }
  });

  if (!count) {
    const empty = document.createElement("span");
    empty.className = "empty-social";
    empty.textContent = "Your social links will appear here.";
    previewSocials.appendChild(empty);
  }
}

function showMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${type}`.trim();
}

function renderSavedProfile(profile) {
  // Build the saved card using DOM methods so profile data is treated as text.
  savedProfile.replaceChildren();

  const card = document.createElement("article");
  card.className = "profile-card";

  const avatarWrap = document.createElement("div");
  avatarWrap.className = "avatar-wrap";

  if (profile.avatar_url) {
    const image = document.createElement("img");
    image.className = "profile-avatar-image";
    image.alt = `${profile.name}'s avatar`;
    image.referrerPolicy = "no-referrer";
    image.src = profile.avatar_url;
    image.onerror = () => {
      image.replaceWith(makeInitialsAvatar(profile.name));
    };
    avatarWrap.appendChild(image);
  } else {
    avatarWrap.appendChild(makeInitialsAvatar(profile.name));
  }

  const title = document.createElement("h3");
  title.textContent = profile.name;

  const bio = document.createElement("p");
  bio.className = "profile-bio";
  bio.textContent = profile.bio || "No bio added yet.";

  const skills = document.createElement("div");
  skills.className = "preview-skills";

  (profile.skills || []).forEach((skill) => {
    const chip = document.createElement("span");
    chip.className = "skill-chip";
    chip.textContent = skill;
    skills.appendChild(chip);
  });

  const socials = document.createElement("nav");
  socials.className = "profile-social-links";
  socials.setAttribute("aria-label", "Saved social links");

  [
    ["GitHub", profile.github_url],
    ["LinkedIn", profile.linkedin_url],
    ["Portfolio", profile.portfolio_url]
  ].forEach(([label, value]) => {
    const link = createSocialLink(label, value);

    if (link) socials.appendChild(link);
  });

  const footer = document.createElement("small");
  footer.textContent = `Profile ID: ${profile.id}`;

  card.append(avatarWrap, title, bio, skills, socials, footer);
  savedProfile.appendChild(card);
}

function makeInitialsAvatar(name) {
  const avatar = document.createElement("div");
  avatar.className = "avatar-placeholder";
  avatar.textContent = getInitials(name);
  return avatar;
}

[
  nameInput,
  bioInput,
  skillsInput,
  avatarInput,
  githubInput,
  linkedinInput,
  portfolioInput
].forEach((input) => {
  input.addEventListener("input", updatePreview);
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) return;

  const skills = parseSkills(skillsInput.value);

  if (skills.length > 20 || skills.some((skill) => skill.length > 40)) {
    showMessage("Use up to 20 skills, each no longer than 40 characters.", "error");
    return;
  }

  const profileData = {
    name: nameInput.value.trim(),
    bio: bioInput.value.trim(),
    skills,
    avatar_url: avatarInput.value.trim(),
    github_url: githubInput.value.trim(),
    linkedin_url: linkedinInput.value.trim(),
    portfolio_url: portfolioInput.value.trim()
  };

  submitButton.disabled = true;
  submitButton.firstChild.textContent = "Saving profile...";
  showMessage("Sending your details to the server...");

  try {
    const response = await fetch(`${API_URL}/profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(profileData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Unable to save your profile.");
    }

    renderSavedProfile(result.profile);
    showMessage(
      `Profile saved successfully! Your profile ID is ${result.profile.id}.`,
      "success"
    );

    document.getElementById("savedProfile").scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
  } catch (error) {
    console.error("Profile submission failed:", error);

    if (error instanceof TypeError) {
      showMessage(
        "Cannot connect to the backend. Make sure the server is running on port 5000.",
        "error"
      );
    } else {
      showMessage(error.message || "Something went wrong. Please try again.", "error");
    }
  } finally {
    submitButton.disabled = false;
    submitButton.firstChild.textContent = "Generate my profile ";
    updatePreview();
  }
});

updatePreview();
