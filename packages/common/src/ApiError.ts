import { CustomError } from './CustomError';


export class ApiError extends CustomError {
  constructor(message: string, public readonly status: number, public readonly code: string | null = null) {
    super(message);
  }

  get cancelled() {
    return this.status === -999;
  }
}