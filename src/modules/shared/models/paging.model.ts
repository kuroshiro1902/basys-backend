import { z } from 'zod';

export interface TPageData<T> {
  data: T[];
  pageInfo: TPageInfo;
}

export type TPageInfo = {
  pageIndex?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  totalPage?: number;
};

export const pagingSchema = (defaultPageSize = 12) =>
  z
    .object({
      pageIndex: z.number().int().positive().default(1),
      pageSize: z.number().int().positive().default(defaultPageSize),
    })
    .default({ pageIndex: 1, pageSize: defaultPageSize });
