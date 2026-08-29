export type AiTask = "roleplay" | "writing_feedback" | "speech_feedback";

export interface AiRequest {
  task: AiTask;
  input: string;
  context?: Readonly<Record<string, unknown>>;
}
export interface AiResponse {
  output: string;
  provider: string;
  model: string;
  requestId: string;
}

export interface AiProvider {
  generate(request: AiRequest): Promise<AiResponse>;
}

export interface AiExecutionResult {
  response: AiResponse;
  usedFallback: boolean;
  failureCode?: "provider_error";
}

export type AiResponder = (request: AiRequest) => AiResponse | Promise<AiResponse>;

export class MockAiProvider implements AiProvider {
  constructor(private readonly responder: AiResponder) {}

  async generate(request: AiRequest): Promise<AiResponse> {
    return this.responder(request);
  }
}

export async function executeWithFallback(
  provider: AiProvider,
  request: AiRequest,
  fallback: AiResponder,
): Promise<AiExecutionResult> {
  try {
    return {
      response: await provider.generate(request),
      usedFallback: false,
    };
  } catch {
    return {
      response: await fallback(request),
      usedFallback: true,
      failureCode: "provider_error",
    };
  }
}
