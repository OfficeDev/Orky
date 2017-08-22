import {EventEmitter} from 'events';
import {ArgumentNullException} from "../../Errors";
import {BotMessage, BotResponse} from "../../Models";
import {ILogger} from "../../Logging";
import {IBotResponseHandler, IBotConnection} from "../Interfaces";

export abstract class BotConnectionBase extends EventEmitter implements IBotConnection {
  readonly botId: string;
  protected readonly botName: string;
  protected _socket: SocketIO.Socket;
  protected _responseTimeout: number;
  protected _logger: ILogger;

  constructor(socket: SocketIO.Socket, botId: string, responseTimeout: number, logger: ILogger) {
    super();
    if (!socket) {
      throw new ArgumentNullException("socket");
    }
    if (!botId) {
      throw new ArgumentNullException("botId");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }

    this.botId = botId;
    this.botName = "Unnamed";
    this._socket = socket;
    this._responseTimeout = responseTimeout;
    this._logger = logger;

    this._socket.on('disconnecting', (reason) => {
      this._logger.debug(`Connection (${socket.id}) with ${this.botName} (${this.botId}) is disconnecting. reason=${reason}`);
    });

    this._socket.on('disconnect', (reason) => {
      this._logger.info(`Connection (${socket.id}) with ${this.botName} (${this.botId}) disconnected. reason=${reason}`);
      this.emit('disconnected', this.botId);
    });

    this._socket.on('error', (error) => {
      this._logger.error(`Connection (${socket.id}) with ${this.botName} (${this.botId}) experienced an error. error=${error}`);
    });
  }

  disconnect(): void {
    this._socket.disconnect();
  }

  sendMessage(message: BotMessage, responseHandler: IBotResponseHandler): void {
    const event = `message-${message.id}`;
    this._socket.on(event, (data) => {
      const response = new BotResponse(data.type, data.messages);
      responseHandler(response);
    });

    // Remove listeners to clean up memory.
    setTimeout((event) => {
      this._socket.removeAllListeners(event);
    }, this._responseTimeout, event);

    this._socket.emit('post_message', message);
  }

  rename(name: string): void {
    this._logger.debug(`Connection (${this._socket.id}) with ${this.botName} (${this.botId}) has been renamed to '${name}'.`);
    (this as any).botName = name;
  }
}
export default BotConnectionBase;
