import { postgres } from '@/lib/prisma.lib';
import {
  TCollection,
  TCollectionCreate,
  TCollectionQuery,
  TCollectionUpdate,
} from './collection.model';
import { ResponseData } from '@/base/service';
import { StatusCodes } from 'http-status-codes';
import { TPageData, TPageInput } from '../shared/models/paging.model';
export class CollectionService {
  base = postgres.collection;

  constructor() {}

  async getCollections(
    userId: number,
    { search, pageIndex, pageSize }: TCollectionQuery,
  ) {
    const skip = (pageIndex - 1) * pageSize;
    const collections = await this.base.findMany({
      where: { user_id: userId, name: { contains: search, mode: 'insensitive' } },
      skip,
      take: pageSize,
    });
    const totalCount = await this.base.count({
      where: { user_id: userId, name: { contains: search, mode: 'insensitive' } },
    });
    const totalPage = Math.ceil(totalCount / pageSize);
    const hasNextPage = skip + collections.length < totalCount;

    const data: TPageData<TCollection> = {
      data: collections,
      pageInfo: {
        pageIndex,
        pageSize,
        totalPage,
        hasNextPage,
      },
    };
    return ResponseData.success({
      data,
    });
  }

  async createCollection(userId: number, data: TCollectionCreate) {
    const collection = await this.base.create({
      data: {
        ...data,
        user_id: userId,
      },
    });
    return ResponseData.success({
      data: collection,
      statusCode: StatusCodes.CREATED,
    });
  }

  async updateCollection(id: number, userId: number, data: TCollectionUpdate) {
    const collection = await this.base.findFirst({
      where: { id, user_id: userId },
    });

    if (!collection) {
      return ResponseData.fail({
        message: 'Không tìm thấy collection!',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const updated = await this.base.update({
      where: { id },
      data,
    });

    return ResponseData.success({
      data: updated,
      statusCode: StatusCodes.OK,
    });
  }

  async deleteCollection(id: number, userId: number) {
    const collection = await this.base.findFirst({
      where: { id, user_id: userId },
    });

    if (!collection) {
      return ResponseData.fail({
        message: 'Không tìm thấy collection!',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    const deleted = await this.base.delete({
      where: { id },
    });

    return ResponseData.success({
      message: 'Xóa collection thành công!',
      data: deleted,
      statusCode: StatusCodes.OK,
    });
  }

  async getCollectionById(id: number, userId: number) {
    const collection = await this.base.findFirst({
      where: { id, user_id: userId },
    });
    if (!collection) {
      return ResponseData.fail({
        message: 'Không tìm thấy collection!',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }
    return ResponseData.success({
      data: collection,
    });
  }
}

export const collectionService = new CollectionService();
