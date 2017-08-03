import * as fs from "fs";
import {InvalidOperationException} from "../Errors";
import {IConfig} from "./Interfaces";

export class Config implements IConfig {
  readonly Name: string;
  readonly Version: string;
  readonly MicrosoftAppId: string;
  readonly MicrosoftAppPassword: string;
  readonly ServerPort: string;
  readonly MessagesEndpoint: string;
  readonly DefaultLocale: string;
  readonly LocalePath: string;
  readonly BotDataFilePath: string;
  readonly LogLevel: number | string;
  readonly BotResponseTimeout: number;

  constructor() {
    try {
      const packageData = JSON.parse(fs.readFileSync("package.json", "UTF8"));
      this.Name = process.env.NAME || packageData.name || "Orky";
      this.Version = process.env.VERSION || packageData.version;
    }
    catch(error) {
      throw new InvalidOperationException(`Could not read package.json file. error=${error}`);
    }

    if (!process.env.MICROSOFT_APP_ID) {
      throw new InvalidOperationException("Environment variable 'MICROSOFT_APP_ID' not set.");
    }
    this.MicrosoftAppId = process.env.MICROSOFT_APP_ID as string;

    if (!process.env.MICROSOFT_APP_PASSWORD) {
      throw new InvalidOperationException("Environment variable 'MICROSOFT_APP_PASSWORD' not set.");
    }
    this.MicrosoftAppPassword = process.env.MICROSOFT_APP_PASSWORD as string;

    this.ServerPort = process.env.PORT || "3978";
    this.MessagesEndpoint = process.env.MESSAGES_ENDPOINT || "/api/messages";
    this.DefaultLocale = process.env.DEFAULT_LOCALE || "en";
    this.LocalePath = process.env.LOCALE_PATH || "./locale";
    this.BotDataFilePath = process.env.BOT_DATA_FILE_PATH || "./BotData.json";
    this.LogLevel = process.env.LOG_LEVEL || "info";
    let botResponseTimeout = 10000;
    if (process.env.BOT_RESPONSE_TIMEOUT as string) {
      botResponseTimeout = parseInt(process.env.BOT_RESPONSE_TIMEOUT as string) || botResponseTimeout;
    }
    this.BotResponseTimeout = botResponseTimeout;
  }
}
