/** Common roles used in job selectors across the app */
export const JOB_TITLES = [
  // ── Software Development ──
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Web Developer",
  "React Developer",
  "Next.js Developer",
  "JavaScript Developer",
  "TypeScript Developer",
  "WordPress Developer",
  "Mobile App Developer",
  "Android Developer",
  "iOS Developer",
  "Flutter Developer",
  "React Native Developer",

  // ── Design ──
  "UI/UX Designer",
  "Product Designer",
  "Graphic Designer",
  "Web Designer",
  "Motion Graphics Designer",

  // ── Data & AI ──
  "Data Analyst",
  "Business Analyst",
  "Data Scientist",
  "Machine Learning Engineer",
  "AI Engineer",
  "NLP Engineer",
  "Computer Vision Engineer",
  "Data Engineer",
  "Database Administrator",
  "Power BI Developer",

  // ── Cybersecurity & IT ──
  "Cybersecurity Analyst",
  "Information Security Analyst",
  "Network Engineer",
  "System Administrator",
  "IT Support Specialist",

  // ── Cloud & DevOps ──
  "Cloud Engineer",
  "DevOps Engineer",
  "Site Reliability Engineer",

  // ── QA ──
  "QA Engineer",
  "Software Tester",

  // ── Management & Product ──
  "Project Manager",
  "Product Manager",
  "Scrum Master",
  "Operations Manager",

  // ── Sales & Account Management ──
  "Account Manager",
  "Customer Success Manager",
  "Client Relationship Manager",
  "Business Development Executive",
  "Sales Executive",

  // ── Marketing ──
  "Marketing Manager",
  "Digital Marketing Specialist",
  "SEO Specialist",
  "Social Media Manager",
  "Content Writer",
  "Copywriter",
  "Technical Writer",
  "Email Marketing Specialist",
  "Brand Manager",
  "PR Specialist",

  // ── Creative ──
  "Video Editor",

  // ── HR ──
  "HR Assistant",
  "HR Manager",
  "Recruiter",
  "Talent Acquisition Specialist",
  "Training Coordinator",

  // ── Finance ──
  "Finance Analyst",
  "Accountant",
  "Auditor",
  "Bookkeeper",
  "Financial Advisor",

  // ── Customer Support & Admin ──
  "Customer Support Representative",
  "Call Center Agent",
  "Virtual Assistant",
  "Administrative Assistant",
  "Office Assistant",

  // ── Education & Research ──
  "Teacher",
  "English Teacher",
  "Research Assistant",
  "Lab Assistant",
  "Medical Assistant",

  // ── Freelance & E-commerce ──
  "Freelance Proposal Writer",
  "E-commerce Specialist",
  "Amazon Virtual Assistant",
  "Shopify Developer",
  "CRM Specialist",
] as const;

export type JobTitle = (typeof JOB_TITLES)[number];