// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {IBotService} from "../Services";
import {SessionUtils} from "../Utils";
import {ILogger} from "../Logging";
import {Bot} from "../Models";
import {BotNotFoundException, BotAlreadyExistsException} from "../ServiceErrors";
import BaseDialog from "./BaseDialog";

export class RenameDialog extends BaseDialog {
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
      this._logger.error(`Failed to extract bot name from register message.  message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = SessionUtils.extractTeamId(session);
    if (!teamId) {
      this._logger.error(`Failed to extract team id from add message. message='${session.message}'`);      
      session.send("cannot_extract_team_id");
      return;
    }
    const fromName = match[1];
    const toName = match[2];
    if (fromName === toName) {
      session.send("bot_rename_same_name");
      return;
    }

    let bot: Bot;
    try {
      bot = await this._botService.renameBot(teamId, fromName, toName);
    }
    catch (error) {
      if (error instanceof BotNotFoundException) {
        session.send("bot_not_found_error", fromName);
        return;
      }
      if (error instanceof BotAlreadyExistsException) {
        session.send("bot_rename_already_exists_error", toName, fromName);
        return;
      }
      this._logger.logException(error);
      throw error;
    }

    this._logger.info(`Renamed bot from '${fromName}' to '${bot.name}' in team '${bot.teamId}'`);

    const botCard = new ThumbnailCard(session)
      .title("bot_renamed_title", fromName, bot.name)
      .text("bot_renamed_text", bot.id, bot.secret)
      .images([
        new CardImage(session)
          .url(`${bot.iconUrl}`)
          .alt("bot_avatar_alt_text")
      ]);
    const message = new Message(session).addAttachment(botCard);
    session.send(message);
  }
}
export default RenameDialog;
