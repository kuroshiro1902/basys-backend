import { ResponseData, TResponseData } from '@/modules/shared/models/response-data.model';
import { logger } from '@/server';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ZodError } from 'zod';
export class BaseController {
  constructor() {}

  protected handleResponse = (data: TResponseData, res: Response) => {
    if (data.success) {
      res.status(data.statusCode ?? StatusCodes.OK).json(data);
    } else {
      res.status(data.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).json(data);
    }
  };

  protected handleError = (error: ZodError | Error | string, res: Response) => {
    let errorMessage: string;
    let responseData: TResponseData;
    if (error instanceof ZodError) {
      errorMessage = error.errors
        .map(({ path, message }) => path.join(', ') + ': ' + message.toLowerCase())
        .join(', ');
      responseData = ResponseData.fail({
        message: errorMessage,
        statusCode: StatusCodes.BAD_REQUEST,
      });
    } else {
      errorMessage = typeof error === 'string' ? error : error?.message;
    }

    logger.error(errorMessage);
    responseData = ResponseData.fail({
      message: errorMessage,
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });

    return this.handleResponse(responseData, res);
  };
}
