import {Orky} from './Orky';
import {ConsoleLogger} from './Logger';
import * as fs from 'fs';

const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));

let logLevel = ConsoleLogger.Info;
if (process.env.LOG_LEVEL as string) {
  const logLevelStr = (process.env.LOG_LEVEL as string).toLowerCase()
  switch(logLevelStr) {
    case 'debug':
      logLevel = ConsoleLogger.Debug;
      break;
    case 'info':
      logLevel = ConsoleLogger.Info;
      break;
    case 'warning':
      logLevel = ConsoleLogger.Warning;
      break;
    case 'error':
      logLevel = ConsoleLogger.Error;
      break;
  }
}

const config = {
  Name: packageData.name as string || "Orky",
  Version: packageData.version as string,
  MicrosoftAppId: process.env.MICROSOFT_APP_ID || "",
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD || "",
  ServerPort: process.env.port || process.env.PORT || "3978",
  MessagesEndpoint: process.env.MESSAGES_ENDPOINT || "/api/messages",
  DefaultLocale: process.env.DEFAULT_LOCALE || "en",
  LocalePath: process.env.LOCALE_PATH || "./locale",
  BotDataFilePath: process.env.BOT_DATA_FILE_PATH || "./BotData.json",
  LogLevel: logLevel
};

export default {
  run(): void {
    const logger = new ConsoleLogger(config.LogLevel);
    const orky = new Orky(config, logger);
    orky.run();
  }
}
