import {ILogger} from "../logging/Interfaces";
import {BaseDialog} from "./BaseDialog";
import {Session, ThumbnailCard, CardImage, Message, AttachmentLayout} from "botbuilder/lib/botbuilder";
import {InvalidOperationException} from "../Errors";
import {IBotService} from "../services/Interfaces";
import {SessionUtils} from "../utils/SessionUtils";

export class StatusDialog extends BaseDialog {
  private _botService : IBotService;

  constructor(botService: IBotService, triggerRegExp: RegExp, logger: ILogger) {
    super(triggerRegExp, logger);
    this._botService = botService;
  }

  protected async performAction(session: Session, args?: any): Promise<void> {
    const teamId = SessionUtils.extractTeamId(session);
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
            .url(`${bot.thumbnailImageUri()}`)
            .alt("bot_avatar_alt_text")
        ]);
    })

    const message = new Message(session)
      .attachmentLayout(AttachmentLayout.list)
      .attachments(thumbnailCards);

    session.send(message);
  }
}
