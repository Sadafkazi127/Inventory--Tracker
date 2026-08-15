// Thrown for expected, client-facing failures (validation, not-found, auth, etc.)
// Anything else bubbling up is treated as a 500 and logged, never shown to the client.
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}
