import { NextFunction, Request, Response } from 'express';

import { idempotencyService } from '../di.js';


export function idempotencyMiddleware(req: Request, res: Response, next: NextFunction) {
  const idempotencyKey = req.headers['x-idempotency-key'] as string;

  if (!idempotencyKey) {
    return next();
  }

  const requestKey = `${req.method}:${req.path}:${idempotencyKey}`;

  const lock = idempotencyService.acquire(requestKey);

  if (lock.type === 'PENDING') {
    res.status(409).json({
      error: 'Conflict',
      message: 'Request with this idempotency key is still processing',
    });
    return;
  }

  if (lock.type === 'COMPLETED') {
    const { body, code } = lock.value;

    res.status(code).json(body);
    return;
  }

  (req as any).requestKey = requestKey;

  const json = res.json.bind(res);
  let responseSaved = false;

  res.json = (body: any) => {
    idempotencyService.complete(requestKey, body, res.statusCode);
    responseSaved = true;
    return json(body);
  };

  res.on('finish', () => {
    if (!responseSaved) {
      idempotencyService.release(requestKey);
    }
  });

  res.on('close', () => {
    if (!responseSaved && !res.writableEnded) {
      idempotencyService.release(requestKey);
    }
  });

  next();
}