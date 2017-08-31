// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT license.
import BaseLogger from "./BaseLogger";
import { ArgumentNullException, ArgumentOutOfRangeException } from "../Errors";
import { LogSeverity } from "./LogSeverity";
import * as ApplicationInsights from 'applicationinsights';

export class ApplicationInsightsLogger extends BaseLogger {
  private _appInsightsClient: Client;

  constructor(logLevel: number|string, applicationInsightsKey: string) {
    super(logLevel);
    if (!applicationInsightsKey) {
      throw new ArgumentNullException("applicationInsightsKey");
    }

    ApplicationInsights
      .setup(applicationInsightsKey)
      .setAutoCollectConsole(false);
    ApplicationInsights.start();

    this._appInsightsClient = ApplicationInsights.getClient();
  }

  logMessage(severity: string|number, message: string): void {
    severity = this.mapToAppInsightsSeverity(severity);   
    this._appInsightsClient.trackTrace(message, severity); 
  }

  logException(error: Error): void {
    this._appInsightsClient.trackException(error);
  }

  private mapToAppInsightsSeverity(severity: string|number): number {
    if (typeof severity === 'string') {
      severity = LogSeverity.fromString(severity);
    }

    switch(severity) {
      case LogSeverity.Debug:
        return 0;
      case LogSeverity.Info:
        return 1;
      case LogSeverity.Warn:
        return 2;
      case LogSeverity.Error:
        return 3;
      default:
        throw new ArgumentOutOfRangeException("severity", severity, [0, 1, 2, 3]);
    }
  }
}

export default ApplicationInsightsLogger;
