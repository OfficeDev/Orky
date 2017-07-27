export interface ILogger {
  info(message: string): void
  warn(message: string): void
  debug(message: string): void
  error(message: string): void
}

export class NoLogger {
  info(message: string): void { return; }
  warn(message: string): void { return; }
  debug(message: string): void { return; }
  error(message: string): void { return; }
}

/* tslint:disable:no-console */
export class ConsoleLogger implements ILogger {
  info(message: string): void {
    console.log(`${Date.now()} [Info] ${message}`);
  }
  warn(message: string): void {
    console.log(`${Date.now()} [Warn] ${message}`);
  }
  debug(message: string): void {
    console.log(`${Date.now()} [Debug] ${message}`);
  }
  error(message: string): void {
    console.log(`${Date.now()} [Error] ${message}`);
  }
}
/* tslint:enable:no-console */
