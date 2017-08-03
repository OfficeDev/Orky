import {Session, IMessage} from "botbuilder";
import {Bot, BotStatus, BotMessage, BotResponse} from "../Models";

export interface IBotResponseHandler { (response: BotResponse): void }

export interface IBotService {
  establishConnection(socket: SocketIO.Socket): void;
  registerBotWithName(teamId: string, botName: string): Promise<Bot|undefined>;
  deregisterBotWithName(teamId: string, botName: string): Promise<Bot|undefined>;
  enableBotWithName(teamId: string, botName: string): Promise<Bot|undefined> ;
  disableBotWithName(teamId: string, botName: string): Promise<Bot|undefined>;
  getBotStatuses(teamId: string): Promise<BotStatus[]>;
  sendMessageToBot(teamId: string, botName: string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<Bot|null>;
}

export interface IBotResponseFormatter {
  prepareOutgoingMessages(session : Session, response: BotResponse) : IMessage[];
}
