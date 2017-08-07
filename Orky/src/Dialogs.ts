import {ChatConnector, UniversalBot, Session} from "botbuilder";
import {ArgumentNullException, InvalidOperationException} from './Errors'
import {ILogger} from './logging/Interfaces';
import {IBotService, IBotMessageFormatter} from "./services/Interfaces";

import {RemoveDialog} from "./dialogs/RemoveDialog";
import {AddDialog} from "./dialogs/AddDialog";
import {DisableDialog} from "./dialogs/DisableDialog";
import {EnableDialog} from "./dialogs/EnableDialog";
import {RenameDialog} from "./dialogs/RenameDialog";
import {StatusDialog} from "./dialogs/StatusDialog";
import {TellDialog} from "./dialogs/TellDialog";

export class Dialogs {
  private static AddMatch = /^add ([a-zA-Z0-9]{1,10})$/i;
  private static RemoveMatch = /^remove ([a-zA-Z0-9]{1,10})$/i;
  private static DisableMatch = /^disable ([a-zA-Z0-9]{1,10})$/i;
  private static EnableMatch = /^enable ([a-zA-Z0-9]{1,10})$/i;
  private static RenameMatch = /^rename ([a-zA-Z0-9]{1,10}) to ([a-zA-Z0-9]{1,10})$/i;
  private static StatusMatch = /^status$/i;
  private static TellMatch = /^tell ([a-zA-Z0-9]{1,10}) (.+)$/i;

  static register(connector: ChatConnector, botService: IBotService, botMessageFormatter: IBotMessageFormatter, logger: ILogger) : UniversalBot {
    if (!connector) {
      throw new ArgumentNullException("connector");
    }
    if (!botService) {
      throw new ArgumentNullException("botService");
    }
    if (!botMessageFormatter) {
      throw new ArgumentNullException("botMessageFormatter");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }

    const bot = new UniversalBot(connector, (session: Session) => {
      session.send("unmatched_response");
      session.endDialog();
    });
    new RemoveDialog(botService, Dialogs.RemoveMatch, logger).register("/remove", bot);
    new AddDialog(botService, Dialogs.AddMatch, logger).register("/add", bot);
    new DisableDialog(botService, Dialogs.DisableMatch, logger).register("/disable", bot);
    new EnableDialog(botService, Dialogs.EnableMatch, logger).register("/enable", bot);
    new RenameDialog(botService, Dialogs.RenameMatch, logger).register("/rename", bot);
    new StatusDialog(botService, Dialogs.StatusMatch, logger).register("/status", bot);
    new TellDialog(botService, botMessageFormatter, Dialogs.TellMatch, logger).register("/tell", bot);
    return bot;
  }
}
