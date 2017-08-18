import {Session, IMessage} from "botbuilder";
import {Bot, BotStatus, BotMessage, BotResponse} from "../Models";

export interface IBotResponseHandler { (response: BotResponse): void }

export interface IBotService {
  establishConnection(socket: SocketIO.Socket): void;
  registerBotWithName(teamId: string, botName: string): Promise<Bot|null>;
  deregisterBotWithName(teamId: string, botName: string): Promise<Bot|null>;
  enableBotWithName(teamId: string, botName: string): Promise<Bot|null>;
  disableBotWithName(teamId: string, botName: string): Promise<Bot|null>;
  renameBot(teamId: string, fromName: string, toName: string): Promise<Bot|null>;
  getBotStatuses(teamId: string): Promise<BotStatus[]>;
  sendMessageToBot(teamId: string, botName: string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<Bot|null>;
  copyBot(teamId: string, botName: string) : Promise<string|null>;
  pasteBot(teamId: string, copyId: string) : Promise<Bot|null>;
}

export interface IBotMessageFormatter {
  toBotFrameworkMessage(session : Session, response: BotResponse) : IMessage[];
}
