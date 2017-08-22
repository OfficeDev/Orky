import {EventEmitter} from 'events';
import {ArgumentNullException, ArgumentException} from "../Errors";
import {Bot, BotMessage, BotResponse} from "../Models";
import {ILogger} from "../Logging";
import {IBotRepository} from "../Repositories";
import {IBotResponseHandler, IBotConnection, IBotConnectionManager} from "./Interfaces";
import {BotConnectionV1, BotConnectionV2} from "./BotConnections";
import {BotNotConnectedException, UnsupportedProtocolException, ConnectionNotAuthorizedException} from "../ServiceErrors";

export class BotConnectionManager implements IBotConnectionManager {
  private _responseTimeout: number;
  private _botRepository: IBotRepository;
  private _botConnections: {[key:string]: IBotConnection};  
  private _logger: ILogger;

  constructor(botRepository: IBotRepository, responseTimeout: number, logger: ILogger) {
    if (!botRepository) {
      throw new ArgumentNullException("botRepository");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }

    this._botRepository = botRepository;
    this._botConnections = {};
    this._logger = logger;
    this._responseTimeout = responseTimeout;
  }

  async authorizeConnection(socket: SocketIO.Socket): Promise<void> {
    let handshake = socket.handshake;
    if (!handshake || !handshake.query || !handshake.query.version) {
      this._logger.debug(`Connection (${socket.id}) did not provide a version. Attempting with protocol 1.0.`);
      return Promise.resolve();
    }

    if (handshake.query.version === "2.0") {
      const botId = socket.request.botId;
      const botSecret = socket.request.botSecret;
      const bot =  await this._botRepository.findById(botId);
      if(bot && bot.secret === botSecret) {
        this._logger.debug(`Connection (${socket.id}) successfully authenticated with protocol 2.0.`);
        return Promise.resolve();
      }
    }

    this._logger.debug(`Connection (${socket.id}) does not support any known protocols`);
    return Promise.reject(new ConnectionNotAuthorizedException());
  }

  async establishConnection(socket: SocketIO.Socket): Promise<string> {
    let connectionFactory = null
    let handshake = socket.handshake;
    if (!handshake || !handshake.query || !handshake.query.version) {
      connectionFactory = (socket: SocketIO.Socket) => this.createV1Connection(socket);
    }

    if (handshake.query.version === "2.0") {
      connectionFactory = (socket: SocketIO.Socket) => this.createV2Connection(socket);
    }

    if (!connectionFactory) {
      this._logger.debug(`Connection (${socket.id}) does not support any known protocols`);
      socket.disconnect();
      throw new UnsupportedProtocolException(handshake.query.version);
    }

    const connection = await connectionFactory(socket);
    connection.on('disconnected', (botId) => {
      if (this._botConnections[botId] === connection) {
        delete this._botConnections[botId];
      }
    });
    
    if (this._botConnections[connection.botId] !== connection) {
      this.disconnect(connection.botId);
      this._botConnections[connection.botId] = connection;
    }
    return connection.botId;
  }

  async disconnect(botId: string): Promise<void> {
    const connection = this._botConnections[botId];
    if (connection) {
      connection.disconnect();
    }
  }

  async isConnected(botId: string): Promise<boolean> {
    return !!this._botConnections[botId];
  }

  async sendMessage(botId:string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<void> {
    const connection = this._botConnections[botId];
    if (!connection) {
      throw new BotNotConnectedException(botId);
    }

    connection.sendMessage(message, responseHandler);
  }

  async rename(botId: string, name: string) : Promise<void> {
    const connection = this._botConnections[botId];
    if (!connection) {
      throw new BotNotConnectedException(botId);
    }
    connection.rename(name);
  }

  private async createV2Connection(socket: SocketIO.Socket): Promise<BotConnectionV2> {
    const botId = socket.request.botId;
    return new BotConnectionV2(socket, botId, this._responseTimeout, this._logger);
  }

  private createV1Connection(socket: SocketIO.Socket): Promise<BotConnectionV1> {
    return new Promise((resolve, reject) => {
      let authenticated = false;

      const unauthorized = () => {
        socket.emit('no_registration');
        socket.disconnect();
        return reject(new ConnectionNotAuthorizedException());
      }

      socket.on('register', (botData) => {
        const botId = botData.id;
        const botSecret = botData.secret;

        if (!botId || !botSecret) {
          this._logger.debug(`Connection (${socket.id}) did not send 'id' or 'secret'`);
          return unauthorized();
        }  

        return this._botRepository.findById(botId)
          .then((bot) => {
            if (!bot || bot.secret !== botSecret) {
              this._logger.debug(`Connection (${socket.id}) did not correct send 'id' or 'secret'`);
              return unauthorized();
            }

            authenticated = true;
            const connection = new BotConnectionV1(socket, bot.id, this._responseTimeout, this._logger);
            this._logger.debug(`Connection (${socket.id}) registered successfully as ${bot.name} (${bot.id}).`);
            resolve(connection);
          })
          .catch((error) => {
            return unauthorized();
          });
      });

      setTimeout(() => {
        if(!authenticated) {
          this._logger.debug(`Connection (${socket.id}) did not attempt to register.`);
          return unauthorized();
        }
      }, 10000);
    });
  }
}
export default BotConnectionManager;
