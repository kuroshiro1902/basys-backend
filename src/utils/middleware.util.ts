import { NextFunction, Request, RequestHandler, Response } from 'express';
import { handleError } from './handle-error.util';
import { handleResponse } from './handle-response.util';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export const middleware = (fn: AsyncRequestHandler | RequestHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await fn(req, res, next);
      handleResponse(result, res);
    } catch (error: any) {
      handleError(error, res);
    }
  };
};
