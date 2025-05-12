import { Response } from 'express';
import {
  ZCollection,
  ZCollectionCreate,
  ZCollectionQuery,
  ZCollectionUpdate,
} from './collection.model';
import { TAuthRequest } from '../auth/auth.model';
import { BaseController } from '@/base/controller';
import { collectionService as collectionServiceInstance } from './collection.service';
import { ZUser } from '../user/user.model';
export class CollectionController extends BaseController {
  constructor(private collectionService = collectionServiceInstance) {
    super();
  }

  async getCollections(req: TAuthRequest, res: Response) {
    const userId = ZUser.shape.id.parse(req.user?.id);
    const query = ZCollectionQuery.parse(req.query);
    const result = await this.collectionService.getCollections(userId, query);
    this.handleResponse(result, res);
  }

  async createCollection(req: TAuthRequest, res: Response) {
    try {
      const userId = ZUser.shape.id.parse(req.user?.id);
      const data = ZCollectionCreate.parse(req.body);
      const result = await this.collectionService.createCollection(userId, data);
      this.handleResponse(result, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async updateCollection(req: TAuthRequest, res: Response) {
    try {
      const userId = ZUser.shape.id.parse(req.user?.id);
      const id = ZCollection.shape.id.parse(req.params.id);
      const data = ZCollectionUpdate.parse(req.body);
      const result = await this.collectionService.updateCollection(id, userId, data);
      this.handleResponse(result, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }

  async deleteCollection(req: TAuthRequest, res: Response) {
    const userId = ZUser.shape.id.parse(req.user?.id);
    const id = ZCollection.shape.id.parse(req.params.id);
    const result = await this.collectionService.deleteCollection(id, userId);
    this.handleResponse(result, res);
  }

  async getCollectionById(req: TAuthRequest, res: Response) {
    try {
      const userId = ZUser.shape.id.parse(req.user?.id);
      const id = ZCollection.shape.id.parse(req.params.id);
      const result = await this.collectionService.getCollectionById(id, userId);
      this.handleResponse(result, res);
    } catch (error: any) {
      this.handleError(error, res);
    }
  }
}

export const collectionController = new CollectionController();
