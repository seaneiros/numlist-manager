export class RequestCoalescer<Response> {
  private readonly requests: Map<string, BatchRequest<Response>> = new Map();

  run(key: string, handler: () => Promise<Response>): Promise<Response> {
    const batch = this.requests.get(key);

    if (batch) {
      return new Promise((resolve, reject) => {
        batch.append({ resolve, reject })
      });
    }

    const newBatch: BatchRequest<Response> = new BatchRequest<Response>(handler()
      .then(result => {
        newBatch.resolve(result);
        return result;
      })
      .catch(err => {
        newBatch.reject(err);
        throw err;
      })
      .finally(() => { this.requests.delete(key); })
    );

    this.requests.set(key, newBatch);

    return newBatch.requestPromise;
  }
}


/* HELPERS */

type QueueHandlers<T> = {
  resolve(val: T): void;
  reject(err: Error): void;
}

class BatchRequest<T> {

  constructor(
    readonly requestPromise: Promise<T>,
    private readonly queue: QueueHandlers<T>[] = [],
  ) {}

  append(handlers: QueueHandlers<T>) {
    this.queue.push(handlers);
  }

  resolve(value: T) {
    this.queue.forEach(({ resolve }) => resolve(value));
  }

  reject(err: Error) {
    this.queue.forEach(({ reject }) => reject(err));
  }
}