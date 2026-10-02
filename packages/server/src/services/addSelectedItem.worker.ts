import { UnhandledValueError } from '@sorter/common';
import { IStore }              from '../store/types.js';
import { TaskQueue }           from '../utils/queue.js';
import { IWorker }             from './types.js';


export type SelectedItemCreationTask = {
  type: 'add-selected-item-task';
  payload: {
    value: number;
  };
};

export type SelectedItemRemovalTask = {
  type: 'remove-selected-item-task';
  payload: {
    value: number;
  };
};

export type SelectionTask = SelectedItemCreationTask | SelectedItemRemovalTask;

export class SelectionItemListWorker implements IWorker<SelectionTask> {
  private interval: NodeJS.Timeout;

  constructor(
    private readonly queue: TaskQueue<SelectionTask>,
    private readonly store: IStore<number>,
    jobInterval: number,
  ) {
    this.interval = setInterval(this.tick, jobInterval);
  }

  private tick = () => {
    for (const task of this.queue.take()) {
      const { type } = task;
      const { value } = task.payload;

      try {
        switch (type) {
          case 'remove-selected-item-task':
            this.store.removeItemFromSelection(value);
            break;
          case 'add-selected-item-task':
            this.store.addItemToSelection(value);
            break;
          default:
            throw new UnhandledValueError(type)
        }
      } catch (err) {
        console.warn(`Couldn't run task [${type}] over ${value}`, (err as Error).message);
      }
    }
  }

  add(task: SelectionTask): void {
    this.queue.append(task);
  }

  stop(): void {
    clearInterval(this.interval);
  }
}