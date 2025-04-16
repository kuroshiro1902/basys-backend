import { StatusCodes } from 'http-status-codes';

type TSuccessDataInput<Data = unknown> = {
  data: Data;
  message?: string;
  statusCode?: number;
};

type TFailDataInput<Data = unknown> = {
  message: string;
  statusCode?: number;
  data?: Data;
};

export type TSuccessData<Data> = {
  success: true;
  data: Data;
  message?: string;
  statusCode?: number;
};

export type TFailData<Data> = {
  success: false;
  message: string;
  statusCode?: number;
  data?: Data;
};

export type TResponseData<Data = unknown, FailData = unknown> =
  | TSuccessData<Data>
  | TFailData<FailData>;

export const ResponseData = {
  success<Data>({
    data,
    message,
    statusCode = StatusCodes.OK,
  }: TSuccessDataInput<Data>): TSuccessData<Data> {
    return { success: true, message, data, statusCode };
  },

  fail<Data>({
    message,
    statusCode = StatusCodes.INTERNAL_SERVER_ERROR,
    data,
  }: TFailDataInput<Data>): TFailData<Data> {
    return { success: false, message, data, statusCode };
  },
};
