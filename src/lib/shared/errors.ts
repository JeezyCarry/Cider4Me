export interface AppErrorShape {
  code: string;
  message: string;
  retryable: boolean;
  source: string;
}

export class AppError extends Error implements AppErrorShape {
  code: string;
  retryable: boolean;
  source: string;

  constructor(shape: AppErrorShape) {
    super(shape.message);
    this.name = 'AppError';
    this.code = shape.code;
    this.retryable = shape.retryable;
    this.source = shape.source;
  }
}
