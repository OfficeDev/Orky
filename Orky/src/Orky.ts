import * as restify from "restify";
import * as SocketIO from "socket.io";
import {UniversalBot, ChatConnector, IMiddlewareMap, Session} from "botbuilder";
import {ConsoleLogger} from "./logging/ConsoleLogger";
import {ILogger} from "./logging/Interfaces";
import {Config} from "./config/Config";
import {IConfig} from "./config/Interfaces";
import {BotFileRepository} from "./repositories/BotRepository"
import {BotService} from "./services/BotService"
import {BotResponseFormatter} from "./services/BotResponseFormatter"
import {Dialogs} from "./Dialogs";
import {ArgumentNullException} from "./Errors";

// Strip bot mentions from the message text
class StripBotAtMentions implements IMiddlewareMap {
  public readonly botbuilder = (session: Session, next: Function): void => {
    const message = session.message;
    if (message) {
      const botMri = message.address.bot.id.toLowerCase();
      const botAtMentions = message.entities && message.entities.filter(
        (entity) => (entity.type === "mention") && (entity.mentioned.id.toLowerCase() === botMri));
      if (botAtMentions && botAtMentions.length) {
        // Save original text as property of the message
        (message as any).textWithBotMentions = message.text;
        // Remove the text corresponding to each mention
        message.text = botAtMentions.reduce((previousText, entity) => {
          return previousText.replace(entity.text, "").trim();
        }, message.text);
      }
    }
    next();
  }
}

export class Orky {
  private _config: IConfig;
  private _logger: ILogger;
  private _server: restify.Server;

  constructor(config: IConfig) {
    if (!config) {
      throw new ArgumentNullException("config");
    }

    this._config = config;
    this._logger = new ConsoleLogger(config.LogLevel);

    this._logger.info(`Created instance of Orky with config: ${JSON.stringify(this._config, null, 2)}`)
  }

  run(): void {
    const chatConnector = new ChatConnector({
        appId: this._config.MicrosoftAppId,
        appPassword: this._config.MicrosoftAppPassword
    });

    const universalBot = new UniversalBot(chatConnector);
    universalBot.use(new StripBotAtMentions());
    universalBot.set('localizerSettings', {
      defaultLocale: this._config.DefaultLocale,
      botLocalePath: this._config.LocalePath
    })
    
    const botRepository = new BotFileRepository(this._logger, this._config.BotDataFilePath);
    const botService = new BotService(botRepository, this._logger, this._config.BotResponseTimeout);
    const botResponseFormatter = new BotResponseFormatter();
    const dialogs = new Dialogs(this._logger, botService, botResponseFormatter);
    dialogs.use(universalBot);

    this._server = restify.createServer({
      name: this._config.Name,
      version: this._config.Version
    });
    this._server.post(this._config.MessagesEndpoint, chatConnector.listen());
    const io = SocketIO.listen((this._server as any).server);
    this._server.listen(this._config.ServerPort, () => {
      this._logger.info(`${this._server.name} listening to ${this._server.url}`); 
    });

    io.on('connection', (socket) => {
      botService.establishConnection(socket);
    });

    this._logger.info("Orky is running");
  }

  stop(): void {
    this._logger.info("Orky is shutting down");
    this._server.close();
  }
}

export function run(): void {
  const config = new Config();
  const orky = new Orky(config);
  orky.run();
}
