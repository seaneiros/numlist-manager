import {
  IStore,
  SelectionOrderChangeOperation } from '../store/types.js';
import { TaskQueue }              from '../utils/queue.js';
import { IWorker }                from './types.js';


export type ChangeSelectionOrderTask = {
  type: 'change-selection-order-task';
  payload: {
    operation: SelectionOrderChangeOperation<number>;
  };
};

export class ChangeSelectionOrderWorker implements IWorker<ChangeSelectionOrderTask> {
  private interval: NodeJS.Timeout;

  constructor(
    private readonly queue: TaskQueue<ChangeSelectionOrderTask>,
    private readonly store: IStore<number>,
    jobInterval: number,
  ) {
    this.interval = setInterval(this.tick, jobInterval);
  }

  private tick = () => {
    for (const task of this.queue.take()) {
      const { operation } = task.payload;

      try {
        this.store.changeSelectionOrder(operation);
      } catch (err) {
        console.warn(`Couldn't perform operation ${JSON.stringify(operation)}`, (err as Error).message);
      }
    }
  }

  add(task: ChangeSelectionOrderTask): void {
    this.queue.append(task);
  }

  stop(): void {
    clearInterval(this.interval);
  }
}