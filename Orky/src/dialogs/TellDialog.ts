import {ILogger} from "../logging/Interfaces";
import {BaseDialog} from "./BaseDialog";
import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {InvalidOperationException} from "../Errors";
import {BotMessage, BotResponse} from "../Models";
import {IBotService, IBotMessageFormatter} from "../services/Interfaces";
import {SessionUtils} from "../utils/SessionUtils";

export class TellDialog extends BaseDialog {
  private _botService : IBotService;
  private _botMessageFormatter: IBotMessageFormatter;

  constructor(botService: IBotService, botMessageFormatter: IBotMessageFormatter, triggerRegExp: RegExp, logger: ILogger) {
    super(triggerRegExp, logger);
    this._botService = botService;
    this._botMessageFormatter = botMessageFormatter;
  }

  protected buildDialog(): IDialogWaterfallStep {
    return (session: Session) => this.performAction(session);
  }

  private async performAction(session: Session): Promise<void> {
    const incomingMessage = session.message.text || "";
    const match = this._triggerRegExp.exec(incomingMessage);
    if (!match) {
      this._logger.error(`Failed to extract bot name and message from tell message. message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }
    
    const teamId = SessionUtils.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }

    const botName = match[1];
    const message = match[2];
    const sender = SessionUtils.extractSender(session);
    const conversation = session.message.address.conversation;
    const conversationId = conversation ? conversation.id : sender.id;
    const botMessage = new BotMessage(message, teamId, "threadId", conversationId, sender);

    const responseHandler = (response: BotResponse) => {
      const messages = this._botMessageFormatter.toBotFrameworkMessage(session, response);
      messages.forEach((message) => {
        this._logger.info(`Replying from bot named '${botName}' in team '${teamId}'`);
        session.send(message);
      })
    }

    const bot =
      await this._botService.sendMessageToBot(teamId, botName, botMessage, responseHandler);
      
    if (!bot) {
      session.send("bot_not_found", botName);
      return;
    }
    this._logger.info(`Sent message to bot named '${bot.name}' in team '${teamId}'`);
  }
}
