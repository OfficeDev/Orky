import {UniversalBot, Session} from "botbuilder";
import {ILogger} from './Logger';
import {ArgumentNullException, InvalidOperationException} from './Errors'
import BotService from "./services/BotService";
import {Bot} from "./Models"

class Dialogs {
  private RegisterMatch = /^register bot (.+)$/i;
  private DeregisterMatch = /^deregister bot (.+)$/i;
  private TellMatch = /^tell (.+) to (.+)$/i;

  private _logger: ILogger;
  private _botService: BotService;

  constructor(logger: ILogger, botService: BotService) {
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    if (!botService) {
      throw new ArgumentNullException("botService");
    }
    this._logger = logger;
    this._botService = botService;
  }

  root(session: Session, args?: any): void {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    session.send("unmatched_response");
    session.endDialog();
  }

  async deregister(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const match = this.DeregisterMatch.exec(session.message.text);
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
      session.send(`You don't have a bot named '${botName}`);
      return;
    }

    this._logger.info(`Removed bot named '${bot.name}' from team '${bot.teamId}'`);
    session.send(`I removed your bot named '${bot.name}' from my registry.`);
  }

  async register(session: Session, args?: any): Promise<void> {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    const match = this.RegisterMatch.exec(session.message.text);
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
      session.send(`You already have a bot named '${botName}`);
      return;
    }
    this._logger.info(`Added bot named '${bot.name}' to team '${bot.teamId}'`);
    session.send(`I created your bot named '${bot.name}' with id '${bot.id}' and secret '${bot.secret}'.`);
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
    const strVal = statuses.map((status) => `${status.bot.name} (${status.bot.id}): ${status.status}`).join('<br/>');

    this._logger.info(`Retrieved statuses for team '${teamId}'`);
    session.send(`Status:<br/>${strVal}`);
    session.endDialog();
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
      session.send(`You don't have a bot named '${botName}`);
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
  use(bot: UniversalBot, logger: ILogger, botService: BotService) : void {
    const dialogs = new Dialogs(logger, botService);
    bot.dialog('/',
      (session, args) => dialogs.root(session, args));
    bot.dialog("/register",
      (session, args) => dialogs.register(session, args))
      .triggerAction({ matches: /^register bot (.+)$/i });
    bot.dialog("/deregister",
      (session, args) => dialogs.deregister(session, args))
      .triggerAction({ matches: /^deregister bot (.+)$/i });
    bot.dialog("/status",
      (session, args) => dialogs.status(session, args))
      .triggerAction({ matches: /^status/i });
    bot.dialog("/tell", 
      (session, args) => dialogs.tell(session,args))
      .triggerAction({ matches: /^tell (.+) to (.+)$/i });
  }
}
