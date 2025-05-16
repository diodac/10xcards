export class OpenRouterError extends Error {
  public cause?: unknown;
  public statusCode?: number;

  constructor(message: string, cause?: unknown, statusCode?: number) {
    super(message);
    this.name = this.constructor.name;
    this.cause = cause;
    this.statusCode = statusCode;
  }
}

export class ConfigurationError extends OpenRouterError {}
export class NetworkError extends OpenRouterError {}

export class OpenRouterApiError extends OpenRouterError {
  public apiDetails?: unknown;

  constructor(message: string, apiDetails?: unknown, statusCode?: number, cause?: unknown) {
    super(message, cause, statusCode);
    this.apiDetails = apiDetails;
  }
}

export class AuthenticationError extends OpenRouterApiError {}
export class RateLimitError extends OpenRouterApiError {}
export class InvalidRequestError extends OpenRouterApiError {}
export class ServerError extends OpenRouterApiError {}
export class ResponseParsingError extends OpenRouterError {}
