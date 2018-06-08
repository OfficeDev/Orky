// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import {Session, ThumbnailCard, CardImage, Message, AttachmentLayout, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {BotStatus} from "../Models";
import {InvalidOperationException} from "../Errors";
import {IBotService} from "../Services";
import {SessionUtils} from "../Utils";
import {ILogger} from "../Logging";
import BaseDialog from "./BaseDialog";

export class StatusDialog extends BaseDialog {
  private _botService : IBotService;

  constructor(botService: IBotService, triggerRegExp: RegExp, logger: ILogger) {
    super(triggerRegExp, logger);
    this._botService = botService;
  }

  protected buildDialog(): IDialogWaterfallStep {
    return (session: Session) => this.performAction(session);
  }

  private async performAction(session: Session): Promise<void> {
    const teamId = SessionUtils.extractTeamId(session);
    if (!teamId) {
      this._logger.error(`Failed to extract team id from status message. message='${session.message}'`);
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
        .title("bot_status_title",
          bot.name,
          session.gettext(`bot_status_${status.status}`)
        )
        .text("bot_status_text", bot.id, bot.secret)
        .images([
          new CardImage(session)
            .url(`${bot.iconUrl}`)
            .alt("bot_avatar_alt_text")
        ]);
    })

    const message = new Message(session)
      .attachmentLayout(AttachmentLayout.list)
      .attachments(thumbnailCards);

    session.send(message);
  }
}
export default StatusDialog;
