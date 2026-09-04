const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{7,20}$/;

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function validateInternship(input) {
  const fields = {};
  const required = [
    "title", "company", "location", "domain",
    "type", "duration", "stipend", "description", "apply_url"
  ];

  for (const field of required) {
    if (!cleanString(input[field])) fields[field] = "This field is required.";
  }

  const skills = Array.isArray(input.skills)
    ? input.skills.map(cleanString).filter(Boolean).slice(0, 12)
    : [];

  if (!fields.apply_url && !/^https?:\/\/\S+$/i.test(cleanString(input.apply_url))) {
    fields.apply_url = "Enter a valid http(s) URL.";
  }

  if (cleanString(input.title).length > 120) fields.title = "Title must be 120 characters or fewer.";
  if (cleanString(input.description).length > 2000) fields.description = "Description must be 2000 characters or fewer.";

  return {
    valid: Object.keys(fields).length === 0,
    fields,
    value: {
      title: cleanString(input.title),
      company: cleanString(input.company),
      location: cleanString(input.location),
      domain: cleanString(input.domain),
      type: cleanString(input.type) || "Internship",
      duration: cleanString(input.duration),
      stipend: cleanString(input.stipend),
      description: cleanString(input.description),
      skills,
      apply_url: cleanString(input.apply_url)
    }
  };
}

function validateApplication(input) {
  const fields = {};
  const name = cleanString(input.name);
  const email = cleanString(input.email).toLowerCase();
  const phone = cleanString(input.phone);
  const resume_url = cleanString(input.resume_url);
  const cover_note = cleanString(input.cover_note);

  if (!Number.isInteger(Number(input.internship_id))) {
    fields.internship_id = "A valid internship is required.";
  }
  if (name.length < 2 || name.length > 80) fields.name = "Name must be 2–80 characters.";
  if (!emailPattern.test(email)) fields.email = "Enter a valid email address.";
  if (!phonePattern.test(phone)) fields.phone = "Enter a valid phone number.";
  if (!/^https?:\/\/\S+$/i.test(resume_url)) fields.resume_url = "Enter a valid resume URL.";
  if (cover_note.length < 10 || cover_note.length > 1500) fields.cover_note = "Cover note must be 10–1500 characters.";

  return {
    valid: Object.keys(fields).length === 0,
    fields,
    value: {
      internship_id: Number(input.internship_id),
      name,
      email,
      phone,
      resume_url,
      cover_note
    }
  };
}

module.exports = { validateInternship, validateApplication };
