import * as crypto from 'crypto';
import * as SocketIO from "socket.io";
import {ArgumentNullException, ArgumentException} from "../Errors";
import {Bot, BotStatus, BotMessage, BotResponse} from "../Models";
import {ILogger} from "../logging/Interfaces";
import {IBotRepository} from "../repositories/Interfaces";
import {IBotResponseHandler, IBotService} from "./Interfaces";
import {BotConnection} from "./BotConnection";

export class BotService implements IBotService {
  private _botRepository: IBotRepository;
  private _logger: ILogger;
  private _responseTimeout: number;
  private _botConnections: {[key:string]: BotConnection};

  constructor(botRepository: IBotRepository, logger: ILogger, responseTimeout: number) {
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

  establishConnection(socket: SocketIO.Socket): void {
    const connection = new BotConnection(socket, this._botRepository, this._responseTimeout, this._logger);
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
            const bot = new Bot(teamId, botName, secret);
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

  async enableBotWithName(teamId: string, botName: string): Promise<Bot|undefined> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(undefined);
        }

        bot.disabled = false;
        return Promise.resolve(bot);
      });
  }

  async disableBotWithName(teamId: string, botName: string): Promise<Bot|undefined> {
    return this._botRepository
      .findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return Promise.resolve(undefined);
        }

        bot.disabled = true;
        return Promise.resolve(bot);
      });
  }

  async getBotStatuses(teamId: string): Promise<BotStatus[]> {
    return this._botRepository.getAllByTeam(teamId)
      .then((bots) => {
        const statuses = new Array<BotStatus>();
        bots.forEach((bot) => {
          let status = "off";
          if (bot.disabled) {
            status = "disabled";
          }
          else if (this._botConnections[bot.id]) {
            status = "on";
          }
          statuses.push(new BotStatus(bot, status));
        });
        return statuses;
      });
  }

  async sendMessageToBot(teamId: string, botName: string, message: BotMessage, responseHandler: IBotResponseHandler): Promise<Bot|null> {
    return this._botRepository.findByTeamAndName(teamId, botName)
      .then((bot) => {
        if (!bot) {
          return null;
        }

        const connection = this._botConnections[bot.id];
        if (!connection) {
          return null;
        }

        if (bot.disabled) {
          return null;
        }

        connection.sendMessage(message, responseHandler);
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
