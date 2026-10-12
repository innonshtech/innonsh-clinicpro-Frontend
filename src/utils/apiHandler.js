import { ApiResponse } from './apiResponse.js';
import logger from './logger.js';

/**
 * Higher Order Function that wraps a Next.js App Router API route handler.
 * Provides a standardized try/catch block to catch any unhandled exceptions and format
 * them uniformly as HTTP 500 or appropriate status codes without leaking stack traces.
 * 
 * @param {Function} handler The route handler function (e.g., async (req, ctx) => {})
 * @returns {Function} wrapped handler
 */
export function withErrorHandler(handler) {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      if (logger && typeof logger.error === 'function') {
        logger.error(`[API ERROR] ${req?.method || 'UNKNOWN'} ${req?.url || ''} ->`, {
          message: error?.message,
          stack: error?.stack
        });
      } else {
        console.error(`[API ERROR] ${req?.method || 'UNKNOWN'} ${req?.url || ''} ->`, error);
      }

      // Handle validation errors if thrown
      if (error?.name === 'ValidationError' || error?.name === 'ZodError') {
        return ApiResponse.error(
          error.message || 'Validation failed',
          'VALIDATION_ERROR',
          error.details || (typeof error.format === 'function' ? error.format() : []),
          400
        );
      }

      if (error?.code === 11000) {
        return ApiResponse.error(
          'Duplicate Entry Detected',
          'DUPLICATE_ENTRY',
          error.keyValue || [],
          409
        );
      }

      const status = error?.statusCode || error?.status || 500;
      const isDev = process.env.NODE_ENV === 'development';

      return ApiResponse.error(
        isDev && error?.message ? `Server Error: ${error.message}` : (error?.message || 'Internal Server Error'),
        status,
        isDev && error?.stack ? [error.stack] : []
      );
    }
  };
}

export default withErrorHandler;
