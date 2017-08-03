import {BaseLogger} from "./BaseLogger";

/* tslint:disable:no-console */
export class ConsoleLogger extends BaseLogger {
  protected logMessage(severity: string, message: string): void {
    console.log(`${new Date().toISOString()} [${severity}] ${message}`);
  }
}
/* tslint:enable:no-console */
