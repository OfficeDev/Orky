import * as restify from "restify";
import * as SocketIO from "socket.io";
import {UniversalBot, ChatConnector, IMiddlewareMap, Session} from "botbuilder";
import {ILogger, NoLogger} from "./Logger";
import Dialogs from "./Dialogs";
import Config from "./Config";
import {ArgumentNullException} from "./Errors";
import {BotMemoryRepository} from "./repositories/BotRepository"
import BotService from "./services/BotService"

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
  private _config: Config;
  private _logger: ILogger;
  private _server: restify.Server;
  private _bot: UniversalBot;
  private _connector: ChatConnector;

  constructor(config: Config, logger?: ILogger) {
    if (!config) {
      throw new ArgumentNullException("config");
    }
    if (!logger) {
      logger = new NoLogger();
    }

    this._config = config;
    this._logger = logger;

    this._logger.info(`Created instance of Scriptor with config: ${JSON.stringify(this._config, null, 2)}`)
  }

  run(): void {
    this._connector = new ChatConnector({
        appId: this._config.MicrosoftAppId,
        appPassword: this._config.MicrosoftAppPassword
    });

    this._bot = new UniversalBot(this._connector);
    this._bot.use(new StripBotAtMentions());
    this._bot.set('localizerSettings', {
      defaultLocale: this._config.DefaultLocale,
      botLocalePath: this._config.LocalePath
    })
    
    const botRepository = new BotMemoryRepository();
    const botService = new BotService(botRepository);
    Dialogs.use(this._bot, this._logger, botService);

    this._server = restify.createServer({
      name: this._config.Name,
      version: this._config.Version
    });
    this._server.post(this._config.MessagesEndpoint, this._connector.listen());

    const io = SocketIO.listen((this._server as any).server);
    this._server.listen(this._config.ServerPort, () => {
      this._logger.info(`${this._server.name} listening to ${this._server.url}`); 
    });

    io.on('connection', (socket) => {
      botService.establishConnection(socket);
    });
  }

  stop(): void {
    this._server.close();
  }
}
