import express                     from 'express';
import { selectedItemsController } from '../di.js';
import { idempotencyMiddleware }   from '../middleware/idempotency.middleware.js';


const router = express.Router();

router.get('/items/selection', selectedItemsController.getSelectedItemsList);
router.post('/items/selection', idempotencyMiddleware, selectedItemsController.addSelectedItem);
router.delete('/items/selection/:value', idempotencyMiddleware, selectedItemsController.removeSelectedItem);
router.post('/items/selection/order', idempotencyMiddleware, selectedItemsController.changeSelectionOrder);

export default router;