import { PermissionResolvable, Message } from "discord.js";
import { Argument } from "./argument";
import { Bot } from "./bot";
declare type ArgumentList = Record<string, Argument<any>>;
declare type ArgumentValuesList<Args extends ArgumentList> = {
    [name in keyof Args]: Args[name] extends Argument<infer T> ? T : never;
};
export interface CommandInfo<Args extends ArgumentList> {
    name: string;
    description: string;
    permissions?: PermissionResolvable[];
    args?: {
        [name in keyof Args]: string;
    };
}
export declare class CommandBranch<Input, Args extends ArgumentList, Output> {
    readonly info: CommandInfo<Args>;
    readonly args: Args;
    readonly executeable: (this: Bot, mgs: Message, args: ArgumentValuesList<Args>, input: Input) => Promise<Output>;
    private _branches;
    get branches(): ReadonlyArray<CommandBranch<Output, any, any>> | undefined;
    constructor(parentBranch: CommandBranch<any, any, Input>, info: CommandInfo<Args>, args: Args, executeable: (this: Bot, mgs: Message, args: ArgumentValuesList<Args>, input: Input) => Promise<Output>);
    getArgumentName(key: keyof Args & string): string;
}
export declare class CommandMainBranch<Args extends ArgumentList, Output> extends CommandBranch<unknown, Args, Output> {
    constructor(info: CommandInfo<Args>, args: Args, executeable: (this: Bot, mgs: Message, args: ArgumentValuesList<Args>) => Promise<Output>);
}
export declare class Command {
    readonly mainBranch: CommandMainBranch<any, any> & {
        info: {
            aliases?: string[];
        };
    };
    private static readonly spaceReader;
    constructor(mainBranch: CommandMainBranch<any, any> & {
        info: {
            aliases?: string[];
        };
    });
    get info(): CommandInfo<any>;
    handle(bot: Bot, msg: Message, start: number): Promise<void>;
    private readLine;
    private selectBranch;
    private executeBranch;
}
export {};
