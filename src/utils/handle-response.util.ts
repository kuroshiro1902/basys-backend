import { TResponseData } from '@/modules/shared/models/response-data.model';
import { Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const handleResponse = (data: TResponseData, res: Response) => {
  if (data.success) {
    res.status(data.statusCode ?? StatusCodes.OK).json(data);
  } else {
    res.status(data.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR).json(data);
  }
};
