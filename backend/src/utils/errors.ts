export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string = 'INTERNAL_ERROR',
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request') {
    super(message, 400, 'BAD_REQUEST');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string = 'Validation failed',
    public errors?: Record<string, string[]>
  ) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS');
  }
}

export class InsufficientFundsError extends AppError {
  constructor(message: string = 'Insufficient funds') {
    super(message, 409, 'INSUFFICIENT_FUNDS');
  }
}

export class InvalidTokenError extends AppError {
  constructor(message: string = 'Invalid token') {
    super(message, 401, 'INVALID_TOKEN');
  }
}

export class CannotTransferToSameUserError extends AppError {
  constructor(message: string = 'Cannot transfer to the same user') {
    super(message, 400, 'CANNOT_TRANSFER_TO_SAME_USER');
  }
}

export class CouponNotFoundError extends AppError {
  constructor(message: string = 'Coupon not found') {
    super(message, 404, 'COUPON_NOT_FOUND');
  }
}

export class CouponInactiveError extends AppError {
  constructor(message: string = 'Coupon is not active') {
    super(message, 400, 'COUPON_INACTIVE');
  }
}

export class CouponMinAmountNotMetError extends AppError {
  constructor(message: string = 'Minimum order amount not met') {
    super(message, 400, 'COUPON_MIN_NOT_MET');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_ERROR', false);
  }
}
