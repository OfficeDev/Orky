import {ILogger} from "../logging/Interfaces";
import {BaseDialog} from "./BaseDialog";
import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {IBotService} from "../services/Interfaces";
import {SessionUtils} from "../utils/SessionUtils";

export class AddDialog extends BaseDialog {
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
      .text("bot_registered_text", bot.id, bot.secret)
      .images([
        new CardImage(session)
          .url(`${bot.iconUrl}`)
          .alt("bot_avatar_alt_text")
      ]);
    const message = new Message(session).addAttachment(botCard);
    session.send(message);
  }
}
