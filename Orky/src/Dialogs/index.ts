import {ChatConnector, UniversalBot, Session} from "botbuilder";
import {ArgumentNullException, InvalidOperationException} from '../Errors'
import {ILogger} from '../Logging';
import {IBotService, IBotMessageFormatter} from "../Services";
import RemoveDialog from "./RemoveDialog";
import AddDialog from "./AddDialog";
import DisableDialog from "./DisableDialog";
import EnableDialog from "./EnableDialog";
import RenameDialog from "./RenameDialog";
import StatusDialog from "./StatusDialog";
import CopyDialog from "./CopyDialog";
import PasteDialog from "./PasteDialog";
import TellDialog from "./TellDialog";

export class Dialogs {
  private static AddMatch = /^add\s+([a-zA-Z0-9]{1,10})\s*$/i;
  private static RemoveMatch = /^remove\s+([a-zA-Z0-9]{1,10})\s*$/i;
  private static DisableMatch = /^disable\s+([a-zA-Z0-9]{1,10})\s*$/i;
  private static EnableMatch = /^enable\s+([a-zA-Z0-9]{1,10})\s*$/i;
  private static RenameMatch = /^rename\s+([a-zA-Z0-9]{1,10})\s+to\s+([a-zA-Z0-9]{1,10})\s*$/i;
  private static StatusMatch = /^status\s*$/i;
  private static CopyMatch = /^copy\s+([a-zA-Z0-9]{1,10})\s*$/i;
  private static PasteMatch = /^paste\s+([a-zA-Z0-9]{1,8})\s*$/i;  
  private static TellMatch = /^tell\s+([a-zA-Z0-9]{1,10})(?:\s(?:to\s)?(.+))$/i;

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
      logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
      session.send("unmatched_response");
      session.endDialog();
    });
    new RemoveDialog(botService, Dialogs.RemoveMatch, logger).register("/remove", bot);
    new AddDialog(botService, Dialogs.AddMatch, logger).register("/add", bot);
    new DisableDialog(botService, Dialogs.DisableMatch, logger).register("/disable", bot);
    new EnableDialog(botService, Dialogs.EnableMatch, logger).register("/enable", bot);
    new RenameDialog(botService, Dialogs.RenameMatch, logger).register("/rename", bot);
    new StatusDialog(botService, Dialogs.StatusMatch, logger).register("/status", bot);
    new CopyDialog(botService, Dialogs.CopyMatch, logger).register("/copy", bot);
    new PasteDialog(botService, Dialogs.PasteMatch, logger).register("/paste", bot);
    new TellDialog(botService, botMessageFormatter, Dialogs.TellMatch, logger).register("/tell", bot);
    return bot;
  }
}
export default Dialogs;
