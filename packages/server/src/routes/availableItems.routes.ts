import express                      from 'express';
import { availableItemsController } from '../di.js';
import { idempotencyMiddleware }    from '../middleware/idempotency.middleware.js';


const router = express.Router();

router.get('/items', availableItemsController.getAvailableItemsList);
router.post('/items', idempotencyMiddleware, availableItemsController.createAvailableItem);

export default router;