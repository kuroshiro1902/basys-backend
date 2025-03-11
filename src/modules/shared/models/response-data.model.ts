import { StatusCodes } from 'http-status-codes';
export class ResponseData<Data = any> {
  readonly isSuccess: boolean;
  readonly message: string | undefined;
  readonly data: Data | null;
  readonly statusCode: StatusCodes | undefined;

  private constructor(isSuccess: boolean, statusCode: StatusCodes, data?: Data, message?: string) {
    this.isSuccess = isSuccess;
    this.message = message;
    this.data = data ?? null;
    this.statusCode = statusCode;
  }

  static success<Data = any>(data: Data, message?: string, statusCode?: StatusCodes) {
    return new ResponseData(true, statusCode ?? StatusCodes.OK, data, message);
  }

  static fail<Data = any>(message: string, data?: Data, statusCode?: StatusCodes) {
    return new ResponseData(false, statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR, data ?? null, message);
  }
}
