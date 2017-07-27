import {Orky} from './Orky';
import {ConsoleLogger} from './Logger';
import * as fs from 'fs';

const packageData = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const config = {
  Name: packageData.name as string || "Orky",
  Version: packageData.version as string,
  MicrosoftAppId: process.env.MICROSOFT_APP_ID || "",
  MicrosoftAppPassword: process.env.MICROSOFT_APP_PASSWORD || "",
  ServerPort: process.env.port || process.env.PORT || "3978",
  MessagesEndpoint: process.env.MESSAGES_ENDPOINT || "/api/messages",
  DefaultLocale: process.env.DEFAULT_LOCALE || "en",
  LocalePath: process.env.LOCALE_PATH || "./locale"
};

export default {
  run(): void {
    const logger = new ConsoleLogger();
    const orky = new Orky(config, logger);
    orky.run();
  }
}
