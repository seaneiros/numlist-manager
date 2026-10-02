import autocannon from 'autocannon';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createApp } from './app.js';


const DURATION_S = 3;
const CONNECTIONS = 50;

describe('autocannon load', () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    server = createApp().listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  const run = (path: string) => autocannon({
    url: `${baseUrl}${path}`,
    connections: CONNECTIONS,
    duration: DURATION_S,
  });

  const expectHealthy = (result: autocannon.Result) => {
    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.non2xx).toBe(0);
    expect(result['2xx']).toBeGreaterThan(0);
  };

  it('GET /api/health sustains load without errors', async () => {
    expectHealthy(await run('/api/health'));
  }, 30_000);

  it('GET /api/items sustains load without errors', async () => {
    expectHealthy(await run('/api/items?limit=20'));
  }, 30_000);

  it('GET /api/items with search sustains load without errors', async () => {
    expectHealthy(await run('/api/items?limit=20&search=1'));
  }, 30_000);

  describe('POST /api/items', () => {
    // the store is a process-wide singleton: every created value must be unique
    let nextValue = 10_000_000;
    let nextKey = 0;

    const runPost = (setup: (req: any) => { value: number; key?: string }) => autocannon({
      url: `${baseUrl}/api/items`,
      connections: CONNECTIONS,
      duration: DURATION_S,
      requests: [{
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        setupRequest: (req: any) => {
          const { value, key } = setup(req);

          req.body = JSON.stringify({ value });
          if (key) {
            req.headers = { ...req.headers, 'x-idempotency-key': key };
          }

          return req;
        },
      }],
    });

    const countItems = async (value: number) => {
      const res = await fetch(`${baseUrl}/api/items?from=${value}&limit=5`);
      const { items } = await res.json() as { items: number[] };

      return items.filter(i => i === value).length;
    };

    // creation is queued and applied by a worker every 10 s, so poll until it lands
    const waitForItems = async (value: number, timeoutMs = 12_000) => {
      const deadline = Date.now() + timeoutMs;

      while (Date.now() < deadline) {
        const count = await countItems(value);

        if (count > 0) {
          return count;
        }

        await new Promise(resolve => setTimeout(resolve, 250));
      }

      return 0;
    };

    it('sustains load with unique values without errors', async () => {
      const result = await runPost(() => ({ value: nextValue++ }));

      expectHealthy(result);
    }, 30_000);

    it('sustains load with unique idempotency keys without errors', async () => {
      const result = await runPost(() => ({ value: nextValue++, key: `load-key-${nextKey++}` }));

      expectHealthy(result);
    }, 30_000);

    it('creates the item exactly once when all requests share an idempotency key', async () => {
      const value = nextValue++;
      const key = `shared-key-${nextKey++}`;

      const result = await runPost(() => ({ value, key }));

      expect(result.errors).toBe(0);
      expect(result.timeouts).toBe(0);
      // repeats must be replayed (2xx) or rejected as in-flight (409), never fail as duplicates
      expect(result['5xx']).toBe(0);
      expect(await waitForItems(value)).toBe(1);
    }, 30_000);
  });
});
