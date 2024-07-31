import { ArgOutputTy, ArgTy } from './argument.js';
import { Ctxt } from './ctxt.js';

export interface Command<T extends ArgTy> {
    parsers: T;
    meta: Metadata;
    register?(ctx: Ctxt): Promise<boolean>;
    check?(ctx: Ctxt): Promise<boolean>;
    execute(ctx: Ctxt, ...args: ArgOutputTy<T>): Promise<void>;
}

export function command<T extends ArgTy>(t: Command<T>) { return t; }

export interface Metadata {
    name: string,
    aliases?: Array<string>,
}