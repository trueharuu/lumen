import { ILogger, Logger, LogLevel } from "@sapphire/framework";
import { format } from "node:util";

export class Tracing implements ILogger {
  public constructor(public level: LogLevel) {}

  public has(level: LogLevel): boolean {
    return this.level <= level;
  }

  public debug(...values: readonly unknown[]): void {
    return this.write(LogLevel.Debug, ...values);
  }

  public error(...values: readonly unknown[]): void {
    return this.write(LogLevel.Error, ...values);
  }

  public fatal(...values: readonly unknown[]): void {
    return this.write(LogLevel.Fatal, ...values);
  }

  public info(...values: readonly unknown[]): void {
    return this.write(LogLevel.Info, ...values);
  }

  public trace(...values: readonly unknown[]): void {
    return this.write(LogLevel.Trace, ...values);
  }

  public warn(...values: readonly unknown[]): void {
    return this.write(LogLevel.Warn, ...values);
  }

  public write(level: LogLevel, ...values: readonly unknown[]): void {
    if (!this.has(level)) { return; }
    const t = {
      [LogLevel.Debug]: `\x1b[34mDEBUG\x1b[0m`,
      [LogLevel.Error]: `\x1b[31mERROR\x1b[0m`,
      [LogLevel.Fatal]: `\x1b[31mFATAL\x1b[0m`,
      [LogLevel.Info]: `\x1b[32m INFO\x1b[0m`,
      [LogLevel.None]: `\x1b[35mDEBUG\x1b[0m`,
      [LogLevel.Trace]: `\x1b[35mTRACE\x1b[0m`,
      [LogLevel.Warn]: `\x1b[33m WARN\x1b[0m`,
    }[level];
    

    process.stdout.write(
      `\x1b[0m${new Date().toISOString()} ${t} ${values.map((x) => format(x)).join(" ")}\n`
    );
  }
}
