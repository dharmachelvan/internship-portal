const db = require("./db");

const rows = [
  { title: "Frontend Developer Intern", company: "BrightStack", location: "Remote", domain: "Engineering", type: "Internship", duration: "3 months", stipend: "₹15,000/month", description: "Build responsive and accessible interfaces with a modern product team.", skills: ["HTML", "CSS", "JavaScript", "Git"], apply_url: "https://example.com/apply/frontend" },
  { title: "Data Analyst Intern", company: "InsightWorks", location: "Chennai, India", domain: "Data", type: "Internship", duration: "6 months", stipend: "₹18,000/month", description: "Turn business data into dashboards, reports, and actionable insights.", skills: ["SQL", "Excel", "Python", "Power BI"], apply_url: "https://example.com/apply/data" },
  { title: "UI/UX Design Intern", company: "PixelForge", location: "Bengaluru, India", domain: "Design", type: "Internship", duration: "4 months", stipend: "₹12,000/month", description: "Create user flows, wireframes, prototypes, and polished product experiences.", skills: ["Figma", "Wireframing", "Prototyping", "UX Research"], apply_url: "https://example.com/apply/design" },
  { title: "Digital Marketing Intern", company: "GrowthNest", location: "Remote", domain: "Marketing", type: "Internship", duration: "3 months", stipend: "₹10,000/month", description: "Support content, SEO, campaign reporting, and social media growth.", skills: ["SEO", "Content", "Analytics", "Social Media"], apply_url: "https://example.com/apply/marketing" },
  { title: "Backend Developer Intern", company: "CloudPeak", location: "Hyderabad, India", domain: "Engineering", type: "Internship", duration: "6 months", stipend: "₹20,000/month", description: "Develop REST APIs and database-backed services for a cloud platform.", skills: ["Node.js", "Express", "SQL", "REST API"], apply_url: "https://example.com/apply/backend" },
  { title: "Business Analyst Intern", company: "NorthStar Consulting", location: "Mumbai, India", domain: "Business", type: "Internship", duration: "5 months", stipend: "₹16,000/month", description: "Analyze requirements, document processes, and support data-driven decisions.", skills: ["Excel", "SQL", "Documentation", "Communication"], apply_url: "https://example.com/apply/business" },
  { title: "Cybersecurity Intern", company: "SecureLayer", location: "Pune, India", domain: "Security", type: "Internship", duration: "6 months", stipend: "₹17,000/month", description: "Assist with security reviews, logs, vulnerability analysis, and documentation.", skills: ["Networking", "Linux", "OWASP", "Security"], apply_url: "https://example.com/apply/security" },
  { title: "Machine Learning Intern", company: "ModelMint", location: "Remote", domain: "AI/ML", type: "Internship", duration: "6 months", stipend: "₹22,000/month", description: "Prepare datasets, train models, evaluate experiments, and document results.", skills: ["Python", "Pandas", "Machine Learning", "Jupyter"], apply_url: "https://example.com/apply/ml" }
];

const count = db.prepare("SELECT COUNT(*) AS count FROM internships").get().count;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO internships
    (title, company, location, domain, type, duration, stipend, description, skills, apply_url)
    VALUES (@title, @company, @location, @domain, @type, @duration, @stipend, @description, @skills, @apply_url)
  `);
  const seed = db.transaction(() => {
    for (const row of rows) insert.run({ ...row, skills: JSON.stringify(row.skills) });
  });
  seed();
  console.log(`Seeded ${rows.length} internships.`);
} else {
  console.log(`Database already contains ${count} internships; skipping seed.`);
}
