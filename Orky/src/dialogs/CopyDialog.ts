import {ILogger} from "../logging/Interfaces";
import {BaseDialog} from "./BaseDialog";
import {Session, ThumbnailCard, CardImage, Message, IDialogWaterfallStep} from "botbuilder/lib/botbuilder";
import {InvalidOperationException} from "../Errors";
import {IBotService} from "../services/Interfaces";
import {SessionUtils} from "../utils/SessionUtils";

export class CopyDialog extends BaseDialog {
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
      this._logger.error(`Failed to extract bot name from copy message.  message='${session.message.text}'`);
      session.send("cannot_extract_bot_name");
      return;
    }

    const teamId = SessionUtils.extractTeamId(session);
    if (!teamId) {
      session.send("cannot_extract_team_id");
      return;
    }
    const botName = match[1];
    const copyString = await this._botService.copyBot(teamId, botName);
    if (!copyString) {
      session.send("bot_not_found", botName);
      return;
    }

    this._logger.info(`Copied bot named '${botName}' in team '${teamId}'`);
    session.send("bot_copied", botName, copyString);
  }
}
