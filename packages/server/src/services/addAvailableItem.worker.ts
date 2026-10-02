import { IStore }    from '../store/types.js';
import { TaskQueue } from '../utils/queue.js';
import { IWorker }   from './types.js';


export type AvailableItemCreationTask = {
  type: 'add-available-item-task';
  payload: {
    value: number;
  };
};

export class AddAvailableItemWorker implements IWorker<AvailableItemCreationTask> {
  private interval: NodeJS.Timeout;

  constructor(
    private readonly queue: TaskQueue<AvailableItemCreationTask>,
    private readonly store: IStore<number>,
    jobInterval: number,
  ) {
    this.interval = setInterval(this.tick, jobInterval);
  }

  private tick = () => {
    for (const task of this.queue.take()) {
      const { value } = task.payload;

      try {
        this.store.addAvailableItem(value);
        console.log('add item', value);

      } catch (err) {
        console.warn(`Couldn't add ${value}`, (err as Error).message);
      }
    }
  }

  add(task: AvailableItemCreationTask): void {
    this.queue.append(task);
  }

  stop(): void {
    clearInterval(this.interval);
  }
}