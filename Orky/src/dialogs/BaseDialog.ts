import {UniversalBot, Session, IDialogWaterfallStep} from "botbuilder";
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
    let dialogActions = this.buildDialog();
    if (!Array.isArray(dialogActions)) {
      dialogActions = [dialogActions];
    }

    dialogActions = dialogActions.map((action) => this.wrapAction(action));
    if (dialogActions.length > 0) {
      let lastAction = dialogActions[dialogActions.length-1];
      lastAction = this.wrapFinalAction(lastAction);
      dialogActions[dialogActions.length-1] = lastAction;
    }

    bot.dialog(name, dialogActions)
      .triggerAction({
        matches: this._triggerRegExp
      });
  }

  private wrapAction(action: IDialogWaterfallStep): IDialogWaterfallStep {
    return (session: Session, args?: any) => {
      this._logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
      this._logger.debug(`args=${JSON.stringify(args, null, 2)}`);
      if (!session || !session.message) {
        throw new InvalidOperationException("'session' or 'session.message' is undefined.");
      }

      session.sendTyping();
      return action(session, args);
    };
  }

  private wrapFinalAction(action: IDialogWaterfallStep): IDialogWaterfallStep {
    return (session: Session, args?: any) => {
      const result = action(session, args);
      if (typeof result.then === "function") {
        result.then(() => {
          session.endDialog();
        })
      }
      else {
        session.endDialog();
      }
    };
  }

  protected buildDialog() : IDialogWaterfallStep[]|IDialogWaterfallStep {
    return [];
  }
}