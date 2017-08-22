import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {IBotService} from "../Services";
import {ILogger} from "../Logging";
import {SessionUtils} from "../Utils";
import {Bot} from "../Models";
import {BotAlreadyExistsException} from "../ServiceErrors";
import BaseDialog from "./BaseDialog";

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
      this._logger.error(`Failed to extract bot name from add message. message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = SessionUtils.extractTeamId(session);
    if (!teamId) {
      this._logger.error(`Failed to extract team id from add message. message='${session.message}'`);
      session.send("cannot_extract_team_id");
      return;
    }
    const botName = match[1];
    let bot: Bot;
    try {
      bot = await this._botService.registerBotWithName(teamId, botName);
    }
    catch (error) {
      if (error instanceof BotAlreadyExistsException) {
        session.send("bot_register_already_exists_error", botName);
        return;
      }
      this._logger.error(error);
      throw error;
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
export default AddDialog;
