import * as crypto from 'crypto';
import * as SocketIO from "socket.io";
import {EventEmitter} from 'events';
import {v4 as uuid} from 'uuid';
import {Bot, BotStatus} from "../Models";
import {IBotRepository} from "../repositories/BotRepository";
import {ArgumentNullException, ArgumentException} from "../Errors";
import {ILogger} from "../Logger";

class BotConnection extends EventEmitter {
  private _bot: Bot;
  private _socket: SocketIO.Socket;
  private _logger: ILogger;

  constructor(socket: SocketIO.Socket, botRepository: IBotRepository, logger: ILogger) {
    super();
    if (!socket) {
      throw new ArgumentNullException("socket");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    if (!socket.connected) {
      throw new ArgumentException("socket", "Socket is not connected.");
    }

    this._logger = logger;
    this._socket = socket;

    this._socket.once('register', (botData) => {
      this._logger.info(`Registration request for ${JSON.stringify(botData, null, 2)}`);
      const botId = botData.id;
      const botSecret = botData.secret;

      botRepository.findById(botId)
        .then((bot) => {
          if (!bot || bot.secret !== botSecret) {
            this._logger.info(`No registration data found for id ${botId}`);
            socket.emit('no_registration');
            socket.disconnect();
            this.emit('disconnected');
            return;
          }
          this._bot = bot;

          this._logger.info(`${bot.name} (${bot.id}) successfully registered.`);
          socket.emit('registration_data', {id: bot.id, name: bot.name});
          this.emit('registered', bot.id);

          this._socket.once('disconnect', () => {
            this._logger.info(`${bot.name} (${bot.id}) disconnected.`);
            this.emit('disconnected', bot.id);
          });
        });
    });
  }

  disconnect(): void {
    this._socket.disconnect();
    this.emit('disconnected', this._bot.id);
  }

  sendMessage(message: any): void {
    message = {
      text: message.text,
      type: message.type,
      timestamp: message.timestampe,
      localTimestamp: message.localTimestamp,
      address: message.address,
      user: message.user,
      token: message.token
    };

    this._socket.emit('post_message', message);
  }
}

export default class BotService {
  private _botRepository: IBotRepository;
  private _logger: ILogger;
  private _botConnections: {[key:string]: BotConnection};

  constructor(botRepository: IBotRepository, logger: ILogger) {
    if (!botRepository) {
      throw new ArgumentNullException("botRepository");
    }
    if (!logger) {
      throw new ArgumentNullException("logger");
    }
    this._botRepository = botRepository;
    this._botConnections = {};
    this._logger = logger;
  }

  establishConnection(socket: SocketIO.Socket): void {
    const connection = new BotConnection(socket, this._botRepository, this._logger);
    connection.once('registered', (botId) => {
      if (this._botConnections[botId]) {
          this._botConnections[botId].disconnect();
      }
      this._botConnections[botId] = connection;

      connection.once('disconnected', (botId) => {
        if (botId && connection === this._botConnections[botId]) {
          delete this._botConnections[botId];
        }
      });
    });
  }

  async registerBotWithName(teamId: string, botName: string): Promise<Bot|undefined> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (bot) {
          return Promise.resolve(undefined);
        }
        
        return this.createBotSecret()
          .then((secret) => {
            const botId = uuid();
            const bot = new Bot(teamId, botId, botName, secret);
            return this._botRepository.save(bot);
          })
      });
  }

  async deregisterBotWithName(teamId: string, botName: string): Promise<Bot|undefined> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(undefined);
        }

        return this._botRepository.delete(bot);
      });
  }

  async getBotStatuses(teamId: string): Promise<BotStatus[]> {
    return this._botRepository.getAllByTeam(teamId)
      .then((bots) => {
        const statuses = new Array<BotStatus>();
        bots.forEach((bot) => {
          let status = "disconnected";
          if (this._botConnections[bot.id]) {
            status = "connected";
          }
          statuses.push(new BotStatus(bot, status));
        });
        return statuses;
      });
  }

  async sendMessageToBot(teamId: string, botName: string, message: any): Promise<any> {
    return this._botRepository.findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return undefined;
        }

        const connection = this._botConnections[bot.id];
        if (!connection) {
          return undefined;
        }

        connection.sendMessage(message);
        return bot;
      });
  }

  private async createBotSecret() : Promise<string> {
    return new Promise<string>((resolve, reject) => {
      crypto.randomBytes(24, (error, buffer) => {
        if (error) {
          return reject(error);
        }

        const secret = buffer.toString('base64').replace(/\/|\+|=/g, "");
        return resolve(secret);
      });
    });
  }
}
