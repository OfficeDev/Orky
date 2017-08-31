// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import * as fs from "fs";
import {ArgumentNullException, InvalidOperationException} from "../Errors";
import {IDataStorage} from "./Interfaces";
import {ILogger} from "../logging/Interfaces";

export class FileStorage implements IDataStorage {
  private _logger: ILogger
  private _filePath: string;

  constructor(logger: ILogger, filePath: string) {
    if (!logger) {
      throw new ArgumentNullException('logger');
    }
    if (!filePath) {
      throw new ArgumentNullException('filePath');
    }
    this._logger = logger;
    this._filePath = filePath;
  }

  save(data: any) : Promise<void> {
    const content = JSON.stringify(data);
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(this._filePath, content, {encoding: 'UTF8'}, (error) => {
        if (error) {
          this._logger.error(error.message);
          return reject(error);
        }

        this._logger.debug("Data saved to file.");
        resolve();
      });
    });
  }

  load() : Promise<any> {
    return new Promise((resolve, reject) => {
      fs.readFile(this._filePath, {encoding: 'UTF8'}, (error, data) => {
        if (error) {
          this._logger.debug(`Failed to load data from file '${this._filePath}'`);
          if (error.code !== 'ENOENT') {
            this._logger.error(JSON.stringify(error, null, 2));
            return reject(error);
          }
        }

        let dataObj = {};
        if (data && data.length > 0) {
          dataObj = JSON.parse(data);
        }
        resolve(dataObj);
      });
    });
  }
}
export default FileStorage;
