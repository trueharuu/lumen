import { ApplicationCommandOptionData } from 'discord.js';
import { Ctxt, ParseCtxt } from './ctxt.js';

export interface Argument<T> {
  parse(ctxt: ParseCtxt): Promise<T>
  parse_option(ctxt: Ctxt, name: string): Promise<T>
  to_option(name: string, description: string): ApplicationCommandOptionData
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArgTy = Record<string, Argument<any>>;
export type ArgOutputTy<T extends ArgTy> = {
  [K in keyof T]: T[K] extends Argument<infer U> ? U : never;
};
