import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns a consistent JSON response.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Unhandled error:', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';

  res.status(statusCode).json({ error: message });
};
