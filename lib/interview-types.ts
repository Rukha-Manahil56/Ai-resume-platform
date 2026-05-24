/** One message in the mock interview chat */
export type InterviewMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

/** Payload sent from the browser to POST /api/interview */
export type InterviewRequestBody = {
  jobRole: string;
  messages: InterviewMessage[];
};

/** Successful response from POST /api/interview */
export type InterviewResponseBody = {
  reply: string;
};
