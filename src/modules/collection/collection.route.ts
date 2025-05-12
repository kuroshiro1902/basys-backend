import { Router } from 'express';
import { collectionController } from './collection.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = Router();

router.use(authMiddleware.decodeAccessToken.bind(authMiddleware));

router.post('/', collectionController.createCollection.bind(collectionController));
router.patch('/:id', collectionController.updateCollection.bind(collectionController));
router.delete('/:id', collectionController.deleteCollection.bind(collectionController));
router.get('/:id', collectionController.getCollectionById.bind(collectionController));
router.get('/', collectionController.getCollections.bind(collectionController));

export const collectionRouter = router;
