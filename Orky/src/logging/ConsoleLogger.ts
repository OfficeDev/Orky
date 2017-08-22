import BaseLogger from "./BaseLogger";

/* tslint:disable:no-console */
export class ConsoleLogger extends BaseLogger {
  protected logMessage(severity: string, message: string|Error): void {
    if (message instanceof Error) {
      console.log(`${new Date().toISOString()} [${severity}] ${message.message}`);
      if (message.stack) {
        this.debug(message.stack);
      }
    } 
    else {
      console.log(`${new Date().toISOString()} [${severity}] ${message}`);
    }
  }
}
/* tslint:enable:no-console */

export default ConsoleLogger;
