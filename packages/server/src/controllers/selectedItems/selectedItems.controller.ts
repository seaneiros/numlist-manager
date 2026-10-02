import { SelectionTask }                         from '../../services/addSelectedItem.worker.js';
import { ChangeSelectionOrderTask }              from '../../services/changeSelectionOrder.worker.js';
import { IWorker }                               from '../../services/types.js';
import { OrderChangeAction }                     from '../../store/enums.js';
import { IStore, SelectionOrderChangeOperation } from '../../store/types.js';
import { RequestCoalescer }                      from '../../utils/coalescer.js';
import { ControllerHandler }                     from '../types.js';
import { getCriteria }                           from '../utils.js';
import {
  SelectedItemsListResponse,
  SelectionOrderChangeRequest,
  SelectedItemCreationRequestSchema,
  SelectedItemRemovalParamsSchema,
  SelectionOrderChangeRequestSchema }            from './selectedItems.dto.js';


export class SelectedItemsController {

  constructor(
    private readonly store: IStore<number>,
    private readonly coalescer: RequestCoalescer<SelectedItemsListResponse>,
    private readonly selectionListWorker: IWorker<SelectionTask>,
    private readonly orderChangerWorker: IWorker<ChangeSelectionOrderTask>,
  ) {}

  getSelectedItemsList: ControllerHandler = (req, res) => {
    const criteria = getCriteria(req);
    const requestKey = `getAvailableItemsList:${JSON.stringify(criteria)}`;

    this.coalescer.run(requestKey, () => new Promise((res, rej) => {
      try {
        res(this.store.getSelectionItems(criteria));
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

  addSelectedItem: ControllerHandler = (req, res) => {
    const payload = req.body;
    const validationResult = SelectedItemCreationRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      return res.status(422).json({
        error: 'Invalid request',
        message: validationResult.error.message,
      });
    }

    try {
      this.selectionListWorker.add({
        type: 'add-selected-item-task',
        payload: {
          value: validationResult.data.value,
        },
      });

      res.status(202).json();
    } catch (err) {
      res.status(500).json({
        error: 'Internal',
        message: (err as Error).message ?? 'internal error',
      });
    }
  }

  removeSelectedItem: ControllerHandler = (req, res) => {
    const validationResult = SelectedItemRemovalParamsSchema.safeParse(req.params);

    if (!validationResult.success) {
      return res.status(422).json({
        error: 'Invalid request',
        message: validationResult.error.message,
      });
    }

    try {
      this.selectionListWorker.add({
        type: 'remove-selected-item-task',
        payload: {
          value: validationResult.data.value,
        },
      });

      res.status(202).json();
    } catch (err) {
      res.status(500).json({
        error: 'Internal',
        message: (err as Error).message ?? 'internal error',
      });
    }
  }

  changeSelectionOrder: ControllerHandler = (req, res) => {
    const payload = req.body;
    const validationResult = SelectionOrderChangeRequestSchema.safeParse(payload);

    if (!validationResult.success) {
      return res.status(422).json({
        error: 'Invalid request',
        message: validationResult.error.message,
      });
    }

    try {
      this.orderChangerWorker.add({
        type: 'change-selection-order-task',
        payload: {
          operation: this.createSelectionOrderChangeOperation(validationResult.data),
        },
      });

      res.status(202).json();
    } catch (err) {
      res.status(500).json({
        error: 'Internal',
        message: (err as Error).message ?? 'internal error',
      });
    }
  }

  private createSelectionOrderChangeOperation(payload: SelectionOrderChangeRequest): SelectionOrderChangeOperation<number> {
    // moves `src` after `target`
    const { src, target } = payload;

    if (!src && target) {
      return {
        type: OrderChangeAction.MoveTail,
        src: target,
      };
    } else if (src && !target) {
      return {
        type: OrderChangeAction.MoveHead,
        src,
      };
    } else if (src && target) {
      return {
        type: OrderChangeAction.MoveAfter,
        src,
        target,
      };
    }

    throw new Error('Invalid payload');
  }
}