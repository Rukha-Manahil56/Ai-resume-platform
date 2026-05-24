/** Common roles used in job selectors across the app */
export const JOB_TITLES = [
  "Software Engineer",
  "Product Manager",
  "Data Analyst",
  "UX Designer",
  "Marketing Manager",
  "Sales Representative",
  "Project Manager",
  "Business Analyst",
  "DevOps Engineer",
  "Human Resources Specialist",
] as const;

export type JobTitle = (typeof JOB_TITLES)[number];
