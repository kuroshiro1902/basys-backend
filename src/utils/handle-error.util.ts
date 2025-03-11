import { ResponseData } from '@/modules/shared/models/response-data.model';
import { logger } from '@/server';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { handleResponse } from './handle-response.util';
import { ZodError } from 'zod';

export const handleError = (error: ZodError | Error | string, res: Response) => {
  let errorMessage: string;
  let responseData: ResponseData;
  if (error instanceof ZodError) {
    errorMessage = error.errors.map((err) => err.message).join(', ');
    responseData = ResponseData.fail(StatusCodes.BAD_REQUEST, errorMessage);
  } else {
    errorMessage = typeof error === 'string' ? error : error?.message;
  }

  logger.error(errorMessage);
  responseData = ResponseData.fail(StatusCodes.INTERNAL_SERVER_ERROR, errorMessage);

  return handleResponse(responseData, res);
};
