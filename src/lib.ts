import codes from "http-status-codes";
import type { Request, Response, NextFunction } from "express";

export const kIsDisplayable = Symbol.for("http-api-errors.error.isDisplayable");
export const kToHttpError = Symbol.for("http-api-errors.error.toHttpError");

export const toHttpError = (e: any): HttpError => {
  if(e instanceof HttpError) return e;
  if(typeof e?.[kToHttpError] === "function") return e[kToHttpError]();
  const status = Number(e?.status) || 500;
  const message = e?.[kIsDisplayable] ? String(e?.message) : "Internal error";
  return new HttpError(status, message)
}

export class HttpError extends Error {
  
  status: number;
  [kIsDisplayable]: boolean;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this[kIsDisplayable] = true;
  }

  toJSON() {
    return {
      status: this.status,
      message: this[kIsDisplayable] ? this.message : String("Internal error"),
    }
  }
}

const ErrorClass = (status: number) => {
  return class extends HttpError {
    constructor(message: string) {
      super(status, message);
    }
  }
}

export const Unauthorized = ErrorClass(codes.UNAUTHORIZED);
export const Forbidden = ErrorClass(codes.FORBIDDEN);
export const BadRequest = ErrorClass(codes.BAD_REQUEST);
export const NotFound = ErrorClass(codes.NOT_FOUND);
export const Internal  = ErrorClass(codes.INTERNAL_SERVER_ERROR);

export interface Logger {
  warn(message: string): void
}

export const expressJsonCatchHandler = ({ logger }: { logger?: Logger } = {}) => {
  return (e: any, req: Request, res: Response, next: NextFunction) => {
    const oMessage = String(e?.message);
    const error = toHttpError(e);

    logger?.warn(`[HttpApiError]: error in handler at ${req.method} ${req.originalUrl} => ${error.status} ${oMessage}`)

    if(!res.headersSent) {
      res.status(error.status).json({ error })
    }
  }
}