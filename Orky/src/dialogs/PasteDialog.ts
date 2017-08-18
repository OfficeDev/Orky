import {ILogger} from "../logging/Interfaces";
import {BaseDialog} from "./BaseDialog";
import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {InvalidOperationException} from "../Errors";
import {IBotService} from "../services/Interfaces";
import {SessionUtils} from "../utils/SessionUtils";

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
      session.send("cannot_extract_team_id");
      return;
    }
    const copySecret = match[1];
    console.log(`'${copySecret}'`);
    const bot = await this._botService.pasteBot(teamId, copySecret);
    if (!bot) {
      session.send("bot_not_found_with_secret", copySecret);
      return;
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
