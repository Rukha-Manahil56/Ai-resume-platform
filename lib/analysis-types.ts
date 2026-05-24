/** Importance level for a skill the CV is missing */
export type SkillImportance = "high" | "medium" | "low";

/** One skill gap compared to the job description */
export type MissingSkill = {
  name: string;
  importance: SkillImportance;
};

/** A concrete CV rewrite suggestion */
export type Improvement = {
  suggestion: string;
  before: string;
  after: string;
};

/** Interview prep item generated from the CV + role */
export type InterviewQuestion = {
  question: string;
  modelAnswer: string;
};

/** Full structured response from the Gemini ATS analysis */
export type CvAnalysisResult = {
  atsScore: number;
  explanation: string;
  missingSkills: MissingSkill[];
  improvements: Improvement[];
  interviewQuestions: InterviewQuestion[];
};
