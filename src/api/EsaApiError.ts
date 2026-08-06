export class EsaApiError extends Error {
  public readonly status: number | undefined;
  public readonly code: string | undefined;
  public readonly responseMessage: string | undefined;
  public readonly retryAfterSeconds: number | undefined;
  public readonly rateLimitRemaining: number | undefined;
  public readonly rateLimitResetAt: Date | undefined;

  constructor(
    message: string,
    options?: {
      status?: number;
      code?: string;
      responseMessage?: string;
      retryAfterSeconds?: number;
      rateLimitRemaining?: number;
      rateLimitResetAt?: Date;
    },
  ) {
    super(message);
    this.name = "EsaApiError";
    this.status = options?.status;
    this.code = options?.code;
    this.responseMessage = options?.responseMessage;
    this.retryAfterSeconds = options?.retryAfterSeconds;
    this.rateLimitRemaining = options?.rateLimitRemaining;
    this.rateLimitResetAt = options?.rateLimitResetAt;
  }
}
