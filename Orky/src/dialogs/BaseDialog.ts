import {UniversalBot, Session} from "botbuilder";
import {ILogger} from "../logging/Interfaces";
import {ArgumentNullException, InvalidOperationException} from "../Errors";

export class BaseDialog {
  protected _triggerRegExp: RegExp;
  protected _logger: ILogger;

  constructor(triggerRegExp: RegExp, logger: ILogger) {
    if (!triggerRegExp) {
        throw new ArgumentNullException("triggerRegExp");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }

    this._triggerRegExp = triggerRegExp;
    this._logger = logger;
  }

  register(name: string, bot: UniversalBot) {
    if (!name) {
      throw new ArgumentNullException("name");
    }
    if (!bot) {
      throw new ArgumentNullException("bot");
    }

    this._logger.info(`Registered dialog '${name}'`);
    bot.dialog(name, (session, args) => this.action(session, args))
      .triggerAction({
        matches: this._triggerRegExp
      });
  }

  private action(session: Session, args?: any): void {
    this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
    if (!session || !session.message || !session.message.text) {
      throw new InvalidOperationException("'session' or 'session.message' is undefined.");
    }

    session.sendTyping();
    this.performAction(session, args)
      .then(() => {
        session.endDialog();
      });
  }

  protected performAction(session: Session, args?: any) : Promise<void> {
    return Promise.resolve();
  }
}