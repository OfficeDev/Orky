import {UniversalBot, Session, Message, ThumbnailCard, CardImage, AttachmentLayout} from "botbuilder";
import {ILogger} from './Logger';
import {ArgumentNullException, InvalidOperationException} from './Errors'
import BotService from "./services/BotService";
import {Bot} from "./Models"

class Dialogs {
  private AddMatch = /^add ([a-zA-Z0-9]{1,10})$/i;
  private RemoveMatch = /^remove ([a-zA-Z0-9]{1,10})$/i;
  private DisableMatch = /^disable ([a-zA-Z0-9]{1,10})$/i;
  private EnableMatch = /^enable ([a-zA-Z0-9]{1,10})$/i;
  private TellMatch = /^tell ([a-zA-Z0-9]{1,10}) (.+)$/i;

  private _logger: ILogger;
  private _botService: BotService;
  private _serverHost: string;

  constructor(logger: ILogger, serverHost: string, botService: BotService) {
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    if (!botService) {
      throw new ArgumentNullException("botService");
    }
    if (!serverHost) {
      throw new ArgumentNullException("serverHost");
    }
    this._logger = logger;
    this._botService = botService;
    this._serverHost = serverHost;
  }

  root(session: Session, args?: any): void {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    session.send("unmatched_response");
  }

  async remove(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const match = this.RemoveMatch.exec(session.message.text);
    if (!match) {
      this._logger.error(`Failed to extract bot name from deregister message.  message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = this.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }
    const botName = match[1];
    const bot = await this._botService.deregisterBotWithName(teamId, botName);
    if (!bot) {
      session.send("bot_not_found", botName);
      return;
    }

    this._logger.info(`Removed bot named '${bot.name}' from team '${bot.teamId}'`);
    session.send("bot_removed", bot.name);
  }

  async add(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const match = this.AddMatch.exec(session.message.text);
    if (!match) {
      this._logger.error(`Failed to extract bot name from register message.  message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = this.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }
    const botName = match[1];
    const bot = await this._botService.registerBotWithName(teamId, botName);
    if (!bot) {
      session.send("bot_not_registered", botName);
      return;
    }
    this._logger.info(`Added bot named '${bot.name}' to team '${bot.teamId}'`);

    const botCard = new ThumbnailCard(session)
      .title("bot_registered_title", bot.name)
      .text(`Id <b>${bot.id}</b><br/>Secret <b>${bot.secret}</b>`)
      .images([
        new CardImage(session)
          .url(`${this._serverHost}/content/robot${bot.number}.png`)
          .alt("bot_avatar_alt_text")
      ]);
    const message = new Message(session).addAttachment(botCard);
    session.send(message);
  }

  async disable(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const match = this.DisableMatch.exec(session.message.text);
    if (!match) {
      this._logger.error(`Failed to extract bot name from disable message.  message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = this.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }
    const botName = match[1];
    const bot = await this._botService.disableBotWithName(teamId, botName);
    if (!bot) {
      session.send("bot_not_found", botName);
      return;
    }

    this._logger.info(`Removed bot named '${bot.name}' from team '${bot.teamId}'`);
    session.send("bot_disabled", bot.name);
  }

  
  async enable(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const match = this.EnableMatch.exec(session.message.text);
    if (!match) {
      this._logger.error(`Failed to extract bot name from enable message.  message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = this.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }
    const botName = match[1];
    const bot = await this._botService.enableBotWithName(teamId, botName);
    if (!bot) {
      session.send("bot_not_found", botName);
      return;
    }

    this._logger.info(`Removed bot named '${bot.name}' from team '${bot.teamId}'`);
    session.send("bot_enabled", bot.name);
  }

  async status(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const teamId = this.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }

    const statuses = await this._botService.getBotStatuses(teamId);
    if (statuses.length === 0) {
      session.send("no_bots");
      return;
    }

    const thumbnailCards = statuses.map((status) => {
      const bot = status.bot;
      return new ThumbnailCard(session)
        .title(`${bot.name} - ${status.status}`)
        .text(`Id <b>${bot.id}</b><br/>Secret <b>${bot.secret}</b>`)
        .images([
          new CardImage(session)
            .url(`${this._serverHost}/content/robot${bot.number}.png`)
            .alt("bot_avatar_alt_text")
        ]);
    })

    const message = new Message(session)
      .attachmentLayout(AttachmentLayout.list)
      .attachments(thumbnailCards);

    session.send(message);
  }

  async tell(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const match = this.TellMatch.exec(session.message.text);
    if (!match) {
      this._logger.error(`Failed to extract bot name and message from tell message. message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }
    
    const teamId = this.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }

    const botName = match[1];
    const message = match[2];
    const botMessage = (session.message as any);
    botMessage.text = message;

    const bot = await new Promise<string>((resolve, reject) => {
        (session.connector as any).getAccessToken((error: Error, accessToken: string) => {
          if (error) {
            return reject(error);
          }
          resolve(accessToken);
        });
    })
    .then((token) => {
      botMessage.token = token;
      return this._botService.sendMessageToBot(teamId, botName, botMessage);
    });

    if (!bot) {
      session.send("bot_not_found", botName);
      return;
    }
    this._logger.info(`Sent message to bot named '${bot.name}' in team '${bot.teamId}'`);
  }

  private extractTeamId(session: Session) : string | null {
    let teamId = null;
    if (session && session.message) {
      if (session.message.user) {
        teamId = session.message.user.id;
      }
      if (session.message.sourceEvent && session.message.sourceEvent.team) {
        teamId = session.message.sourceEvent.team.id;
      }
    }

    return teamId;
  }
}

export default {
  use(bot: UniversalBot, serverHost: string, logger: ILogger, botService: BotService) : void {
    const dialogs = new Dialogs(logger, serverHost, botService);
    bot.dialog('/',
      (session, args) => dialogs.root(session, args));
    bot.dialog("/add",
      (session, args) => dialogs.add(session, args))
      .triggerAction({ matches: /^add ([a-zA-Z0-9]{1,10})$/i });
    bot.dialog("/remove",
      (session, args) => dialogs.remove(session, args))
      .triggerAction({ matches: /^remove ([a-zA-Z0-9]{1,10})$/i });
    bot.dialog("/disable",
      (session, args) => dialogs.disable(session, args))
      .triggerAction({ matches: /^disable ([a-zA-Z0-9]{1,10})$/i });
    bot.dialog("/enable",
      (session, args) => dialogs.enable(session, args))
      .triggerAction({ matches: /^enable ([a-zA-Z0-9]{1,10})$/i });
    bot.dialog("/status",
      (session, args) => dialogs.status(session, args))
      .triggerAction({ matches: /^status/i });
    bot.dialog("/tell", 
      (session, args) => dialogs.tell(session,args))
      .triggerAction({ matches: /^tell ([a-zA-Z0-9]{1,10}) (.+)$/i });
  }
}
