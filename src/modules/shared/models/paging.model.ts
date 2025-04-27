import { z } from 'zod';

export interface TPageData<T = any> {
  data: T[];
  pageInfo: TPageInfo;
}

export type TPageInfo = {
  pageIndex?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  totalPage?: number;
};

export const ZPageInput = (defaultPageSize = 12, maxPageSize = 64) =>
  z
    .object({
      pageIndex: z.number().int().positive().max(Number.MAX_SAFE_INTEGER).default(1),
      pageSize: z.number().int().positive().max(maxPageSize).default(defaultPageSize),
    })
    .transform((data) => ({
      ...data,
      skip: (data.pageIndex - 1) * data.pageSize,
    }));
