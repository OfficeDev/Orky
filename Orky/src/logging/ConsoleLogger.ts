import BaseLogger from "./BaseLogger";
import { LogSeverity } from "./LogSeverity";

/* tslint:disable:no-console */
export class ConsoleLogger extends BaseLogger {
  logMessage(severity: string|number, message: string): void {
    const timeString = this.getTimeString();
    if (typeof severity !== 'string') {
      severity = LogSeverity.toString(severity);
    }
    console.log(`${timeString} [${severity}] ${message}`);
  }

  logException(error: Error): void {
    const timeString = this.getTimeString();
    console.log(`${timeString} ${error.message}`);
    console.log(`${timeString} ${error.stack}`);
  }

  private getTimeString(): string {
    return new Date().toISOString();
  }
}
/* tslint:enable:no-console */

export default ConsoleLogger;
