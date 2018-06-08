// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {InvalidOperationException} from "../Errors";
import {IBotService} from "../Services";
import {SessionUtils} from "../Utils";
import {ILogger} from "../Logging";
import {Bot} from "../Models";
import {BotNotFoundException, BotAlreadyExistsException, CopyKeyNotFoundException} from "../ServiceErrors";
import BaseDialog from "./BaseDialog";

export class PasteDialog extends BaseDialog {
  private _botService : IBotService;

  constructor(botService: IBotService, triggerRegExp: RegExp, logger: ILogger) {
    super(triggerRegExp, logger);
    this._botService = botService;
  }

  protected buildDialog(): IDialogWaterfallStep {
    return (session: Session) => this.performAction(session);
  }

  private async performAction(session: Session): Promise<void> {
    const incomingMessage = session.message.text || "";
    const match = this._triggerRegExp.exec(incomingMessage);
    if (!match) {
      this._logger.error(`Failed to extract copy secret from paste message.  message='${session.message.text}'`);
      session.send("cannot_extract_copy_secret");
      return;
    }

    const teamId = SessionUtils.extractTeamId(session);
    if (!teamId) {
      this._logger.error(`Failed to extract team id from paste message. message='${session.message}'`);                  
      session.send("cannot_extract_team_id");
      return;
    }
    const copySecret = match[1];
    let bot: Bot;
    try {
      bot = await this._botService.pasteBot(teamId, copySecret);
    }
    catch (error) {
      if (error instanceof BotNotFoundException) {
        session.send("bot_not_found_by_copy_key_error", copySecret);
        return;
      }
      else if (error instanceof CopyKeyNotFoundException) {
        session.send("bot_not_found_by_copy_key_error", copySecret);
        return;
      }
      else if (error instanceof BotAlreadyExistsException) {
        session.send("bot_paste_already_exists_error", copySecret);        
      }
      this._logger.logException(error);
      throw error;
    }

    this._logger.info(`Pasted bot named '${bot.name}' in team '${bot.teamId}'`);
    
    const botCard = new ThumbnailCard(session)
      .title("bot_pasted_title", bot.name)
      .text("bot_pasted_text", bot.id, bot.secret)
      .images([
        new CardImage(session)
          .url(`${bot.iconUrl}`)
          .alt("bot_avatar_alt_text")
      ]);

    const message = new Message(session).addAttachment(botCard);
    session.send(message);
  }
}
export default PasteDialog;
