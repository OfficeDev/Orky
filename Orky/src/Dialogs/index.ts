// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import { ChatConnector, UniversalBot, Session, IEvent, IMiddlewareMap } from "botbuilder";
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
import { IConfig } from "../Config";

// Strip bot mentions from the message text
class TenantFilterMiddleware implements IMiddlewareMap {
  private _logger: ILogger;
  private _allowedTenants: string[];

  constructor(logger: ILogger, allowedTenants: string[]) {
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    this._logger = logger;

    this._allowedTenants = allowedTenants || [];
    this._allowedTenants = this._allowedTenants.map((tenantId) => tenantId.trim().toLowerCase());

    const tenantString = this._allowedTenants.length === 0 ? "All" : this._allowedTenants.join(", ");
    this._logger.info(`Restricting messages to tenants: ${tenantString}`);
  }

  public readonly receive = (event: IEvent, next: Function): void => {
    // No tenant filter means pass through all events.
    if (this._allowedTenants.length === 0) {
      return next();
    }

    // Filter the event out only if it came from the specified tenant.
    if (event && event.sourceEvent) {
      if (event.sourceEvent.tenant && event.sourceEvent.tenant.id as string) {
        const tenantId = event.sourceEvent.tenant.id as string;
        if (this._allowedTenants.includes(tenantId.toLowerCase())) {
          return next();
        }

        this._logger.warn(`Received message from unauthorized tenant '${tenantId}'.`);
      }
      else {
        this._logger.warn(`Received message without tenant data.`);
      }
    }
  }
}

// Strip bot mentions from the message text
class StripBotAtMentions implements IMiddlewareMap {
  public readonly botbuilder = (session: Session, next: Function): void => {
    const message = session.message;
    if (message) {
      const botMri = message.address.bot.id.toLowerCase();
      const botAtMentions = message.entities && message.entities.filter(
        (entity) => (entity.type === "mention") && (entity.mentioned.id.toLowerCase() === botMri));
      if (botAtMentions && botAtMentions.length) {
        // Save original text as property of the message
        (message as any).textWithBotMentions = message.text;
        // Remove the text corresponding to each mention
        message.text = botAtMentions.reduce((previousText, entity) => {
          return previousText.replace(entity.text, "").trim();
        }, message.text);
      }
    }
    next();
  }
}

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

  static register(connector: ChatConnector, botService: IBotService, botMessageFormatter: IBotMessageFormatter, logger: ILogger, config: IConfig) : UniversalBot {
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
    if (!config) {
      throw new ArgumentNullException("config");
    }

    const bot = new UniversalBot(connector, (session: Session) => {
      logger.debug(`Received message=${JSON.stringify(session.message, null,2)}`);
      session.send("unmatched_response");
      session.endDialog();
    });
    bot.use(new TenantFilterMiddleware(logger, config.MicrosoftTenantFilter));
    bot.use(new StripBotAtMentions());
    bot.set('localizerSettings', {
      defaultLocale: config.DefaultLocale,
      botLocalePath: config.LocalePath
    })

    new RemoveDialog(botService, Dialogs.RemoveMatch, logger).register("/remove", bot);
    new AddDialog(botService, Dialogs.AddMatch, logger).register("/add", bot);
    new DisableDialog(botService, Dialogs.DisableMatch, logger).register("/disable", bot);
    new EnableDialog(botService, Dialogs.EnableMatch, logger).register("/enable", bot);
    new RenameDialog(botService, Dialogs.RenameMatch, logger).register("/rename", bot);
    new StatusDialog(botService, Dialogs.StatusMatch, logger).register("/status", bot);
    new CopyDialog(botService, Dialogs.CopyMatch, logger).register("/copy", bot);
    new PasteDialog(botService, Dialogs.PasteMatch, logger).register("/paste", bot);
    new TellDialog(botService, botMessageFormatter, Dialogs.TellMatch, logger).register("/tell", bot);

    logger.info('All dialogs registered');
    
    return bot;
  }
}
export default Dialogs;
