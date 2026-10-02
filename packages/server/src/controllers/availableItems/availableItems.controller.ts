import { ControllerHandler }           from '../types.js';
import { getCriteria }                 from '../utils.js';
import { IStore }                      from '../../store/types.js';
import { RequestCoalescer }            from '../../utils/index.js';
import {
  AvailableItemsListResponse,
  AvailableItemCreationRequestSchema } from './availableItems.dto.js';
import { AvailableItemCreationTask }   from '../../services/addAvailableItem.worker.js';
import { IWorker }                     from '../../services/types.js';


export class AvailableItemsController {

  constructor(
    private readonly store: IStore<number>,
    private readonly coalescer: RequestCoalescer<AvailableItemsListResponse>,
    private readonly worker: IWorker<AvailableItemCreationTask>,
  ) {}

  getAvailableItemsList: ControllerHandler = (req, res) => {
    const criteria = getCriteria(req);
    const requestKey = `getAvailableItemsList:${JSON.stringify(criteria)}`;

    this.coalescer.run(requestKey, () => new Promise((res, rej) => {
      try {
        res(this.store.getAvailableItems(criteria));
      } catch (err) {
        rej(err);
      }
    }))
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      res.status(500).json({
        error: 'Internal',
        message: err.message ?? 'internal error',
      });
    });
  }

  createAvailableItem: ControllerHandler = (req, res) => {
    const payload = req.body;
    const validationResult = AvailableItemCreationRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      return res.status(422).json({
        error: 'Invalid request',
        message: validationResult.error.message,
      });
    }

    try {
      this.worker.add({
        type: 'add-available-item-task',
        payload: {
          value: validationResult.data.value,
        }
      });

      res.status(202).json();
    } catch (err) {
      res.status(500).json({
        error: 'Internal',
        message: (err as Error).message ?? 'internal error',
      });
    }
  }
}


/* HELPERS */

