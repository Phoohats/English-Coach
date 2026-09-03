import { onRequest } from "firebase-functions/v2/https";

const HEALTH_RESPONSE = {
  status: "ok",
  service: "english-career-coach-functions",
  version: "v1",
  environment: "emulator",
} as const;

export const health = onRequest(
  { region: "asia-southeast1" },
  (request, response) => {
    if (request.method !== "GET") {
      response.status(405).json({ error: "method_not_allowed" });
      return;
    }

    response.status(200).json(HEALTH_RESPONSE);
  },
);
