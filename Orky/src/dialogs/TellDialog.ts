// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {InvalidOperationException} from "../Errors";
import {BotMessage, BotResponse} from "../Models";
import {IBotService, IBotMessageFormatter} from "../Services";
import {SessionUtils} from "../Utils";
import {ILogger} from "../Logging";
import {Bot} from "../Models";
import {BotNotConnectedException, BotIsDisabledException, BotNotFoundException} from "../ServiceErrors";
import BaseDialog from "./BaseDialog";

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
      this._logger.error(`Failed to extract team id from tell message. message='${session.message}'`);      
      session.send("cannot_extract_team_id");
      return;
    }

    const botName = match[1];
    const message = match[2];
    const sender = SessionUtils.extractSender(session);
    const conversation = session.message.address.conversation;
    const conversationId = conversation ? conversation.id : sender.id;
    const botMessage = new BotMessage(message, teamId, "threadId", conversationId, sender);

    const responseHandler = (response: BotResponse, error?: Error) => {
      if (error) {
        this._logger.logException(error);
        return;
      }

      this._logger.debug(`Responding with message=${JSON.stringify(response)}'`);
      const messages = this._botMessageFormatter.toBotFrameworkMessage(session, response);
      messages.forEach((message) => {
        this._logger.info(`Replying from bot named '${botName}' in team '${teamId}'`);
        session.send(message);
      })
    }

    let bot: Bot;
    try {
      bot = await this._botService.sendMessageToBot(teamId, botName, botMessage, responseHandler);
    }
    catch(error) {
      if (error instanceof BotIsDisabledException) {
        session.send("bot_tell_is_disabled_error", botName);
        return;
      }
      else if(error instanceof BotNotFoundException) {
        session.send("bot_not_found_error", botName);
        return;
      }
      else if (error instanceof BotNotConnectedException) {
        session.send("bot_tell_not_connected_error", botName);
        return;
      }
      this._logger.logException(error);
      throw error;
    }

    this._logger.info(`Sent message to bot named '${bot.name}' in team '${teamId}'`);
  }
}
export default TellDialog;
