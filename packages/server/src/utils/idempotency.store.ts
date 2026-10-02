import { Time } from '@sorter/common';


export class IdempotencyStore {
  static PENDING_TTL = 5 * Time.Minute;
  static COMPLETED_TTL = 24 * Time.Hour;

  private records: Map<string, IdempotencyRecord> = new Map();

  acquire(key: string): IdempotencyState {
    const record = this.records.get(key);

    if (!record || record.expired) {
      this.release(key);
      this.records.set(key, IdempotencyRecord.Pending(key));

      return { type: 'NONE' };
    }

    if (record.status === 'pending') {
      return { type: 'PENDING' };
    }

    return {
      type: 'COMPLETED',
      value: {
        body: record.response,
        code: record.statusCode ?? 200,
      }
    };
  }

  complete(key: string, response: unknown, statusCode: number): void {
    const record = this.records.get(key);

    if (!record || record.expired) {
      return this.release(key);
    }

    this.records.set(key, record.completeWith(response, statusCode));
  }

  release(key: string) {
    this.records.delete(key);
  }
}


/* HELPERS */

type IdempotencyState = {
  type: 'PENDING' | 'NONE';
} | {
  type: 'COMPLETED';
  value: {
    body: any;
    code: number;
  }
};

class IdempotencyRecord {

  private constructor(
    readonly key: string,
    readonly status: 'pending' | 'completed',
    readonly createdAt: number = Date.now(),
    readonly response?: unknown,
    readonly statusCode?: number,
    readonly completedAt?: number,
  ) {}

  completeWith(response: unknown, statusCode: number) {
    return new IdempotencyRecord(
      this.key,
      'completed',
      this.createdAt,
      response,
      statusCode,
      Date.now()
    );
  }

  get expired() {
    const ts = this.status === 'pending'
      ? this.createdAt + IdempotencyStore.PENDING_TTL
      : this.completedAt! + IdempotencyStore.COMPLETED_TTL;

    return Date.now() > ts;
  }

  static Pending(key: string) {
    return new IdempotencyRecord(key, 'pending');
  }
}