import {Session, IMessage} from "botbuilder";
import {Bot, BotStatus, BotMessage, BotResponse} from "../Models";

export interface IBotResponseHandler { (response: BotResponse): void }

export interface IBotConnectionManager {
  authorizeConnection(socket: SocketIO.Socket): Promise<void>;
  establishConnection(socket: SocketIO.Socket): Promise<string>;
  disconnect(botId: string): Promise<void>;
  isConnected(botId: string): Promise<boolean>;
  sendMessage(botId:string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<void>;
  rename(botId: string, name: string) : Promise<void>;
}

export interface IBotConnection {
  readonly botId: string;

  rename(name: string): void;
  disconnect(): void;
  sendMessage(message: BotMessage, responseHandler: IBotResponseHandler): void;
}

export interface IBotService {
  authorizeConnection(socket: SocketIO.Socket): Promise<void>;
  establishConnection(socket: SocketIO.Socket): Promise<void>;
  registerBotWithName(teamId: string, botName: string): Promise<Bot>;
  deregisterBotWithName(teamId: string, botName: string): Promise<Bot>;
  enableBotWithName(teamId: string, botName: string): Promise<Bot>;
  disableBotWithName(teamId: string, botName: string): Promise<Bot>;
  renameBot(teamId: string, fromName: string, toName: string): Promise<Bot>;
  getBotStatuses(teamId: string): Promise<BotStatus[]>;
  sendMessageToBot(teamId: string, botName: string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<Bot>;
  copyBot(teamId: string, botName: string) : Promise<string>;
  pasteBot(teamId: string, copyId: string) : Promise<Bot>;
}

export interface IBotMessageFormatter {
  toBotFrameworkMessage(session : Session, response: BotResponse) : IMessage[];
}
