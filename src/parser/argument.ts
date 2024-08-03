import { ParseCtxt } from './ctxt.js';

export interface Argument<T> {
  parse(ctxt: ParseCtxt): Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArgTy = Record<string, Argument<any>>;
export type ArgOutputTy<T extends ArgTy> = {
  [K in keyof T]: T[K] extends Argument<infer U> ? U : never;
};
