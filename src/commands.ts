import { PermissionResolvable, Message } from "discord.js";
import { Argument, SpaceReader, ArgumentReader } from "./argument";
import { Bot } from "./bot";

type ArgumentList = Record<string, Argument<any>>;
type ArgumentValuesList<Args extends ArgumentList> = { [name in keyof Args]: Args[name] extends Argument<infer T> ? T : never };

export interface CommandInfo<Args extends ArgumentList> {
    name: string;
    description: string;
    permissions?: PermissionResolvable[];
    args?: { [name in keyof Args]: string };
}

export class CommandBranch<Input, Args extends ArgumentList, Output> {
    private _branches: CommandBranch<Output, any, any>[] = [];

    public get branches(): ReadonlyArray<CommandBranch<Output, any, any>> | undefined {
        return this._branches.length > 0 ? this._branches : undefined;
    }

    constructor(
        parentBranch: CommandBranch<any, any, Input>,
        public readonly info: CommandInfo<Args>,
        public readonly args: Args,
        public readonly executeable: (this: Bot, mgs: Message, args: ArgumentValuesList<Args>, input: Input) => Promise<Output>
    ) {
        parentBranch?._branches.push(this);
    }

    getArgumentName(key: keyof Args & string): string {
        return this.info.args ? this.info.args[key] : key;
    }
}

export class CommandMainBranch<Args extends ArgumentList, Output> extends CommandBranch<unknown, Args, Output> {
    constructor(
        info: CommandInfo<Args>,
        args: Args,
        executeable: (this: Bot, mgs: Message, args: ArgumentValuesList<Args>) => Promise<Output>
    ) {
        super(null as any, info, args, executeable);
    }
}

export class Command {
    private static readonly spaceReader = new SpaceReader();

    constructor(
        public readonly mainBranch: CommandMainBranch<any, any> & { info: { aliases?: string[] } }
    ) { }

    public get info(): CommandInfo<any> {
        return this.mainBranch.info;
    }

    public async handle(bot: Bot, msg: Message, start: number): Promise<void> {
        let line = this.readLine(Command.spaceReader, msg.content.slice(start));
        let branch: CommandBranch<any, ArgumentList, any> = this.mainBranch;
        let output: any = undefined;
        while (true) {
            if (branch.info.permissions) {
                for (const permission of branch.info.permissions) {
                    if (!msg.member?.hasPermission(permission))    throw new Error(`У вас недостаточно прав: ${permission}`);
                    if (!msg.guild?.me?.hasPermission(permission)) throw new Error(`У меня недостаточно прав: ${permission}`);
                }
            }

            const exResult = await this.executeBranch<unknown, any>(bot, msg, line, branch, output);
            line = exResult.line;
            output = exResult.output;

            if (!branch.branches) return;

            const sResult = this.selectBranch(line, branch.branches);
            line = sResult.line;
            branch = sResult.branch;
        }
    }

    private readLine(length: number | ArgumentReader, line: string) {
        let _length = typeof length == 'number' ? length : length.read(line);
        return line.slice(_length);
    }

    private selectBranch<TBranch extends CommandBranch<any, ArgumentList, any>>(
        line: string,
        branches: ReadonlyArray<TBranch>
    ): { line: string, branch: TBranch } | never {
        for (const branch of branches) {
            if (line.startsWith(branch.info.name)) {
                return {
                    line: this.readLine(branch.info.name.length, line),
                    branch
                }
            }
        }
        const keyWordList = branches.map(({ info: { name } }) => `\`${name}\``).join(', ');
        throw new Error(`Ожидалось одно из ключевых слов: ${keyWordList}`);
    }

    private async executeBranch<Input, Output>(bot: Bot, msg: Message, line: string,
        branch: CommandBranch<Input, ArgumentList, Output>, input: Input
    ): Promise<{ output: Output | null, line: string }> {
        if (!branch.executeable) {
            return {
                line: this.readLine(Command.spaceReader, line),
                output: null,
            }
        }

        const _arguments = branch.args as Record<string, Argument<any>>;
        const parsedValues: Record<string, any> = {};
        for (const name in _arguments) {
            const arg = _arguments[name];

            let tokenLength: number;
            try {
                tokenLength = arg.read(line);
                const value = line.substring(0, tokenLength);
                if (tokenLength <= 0) throw null;
                parsedValues[name] = arg.parse(value, msg);
            }
            catch {
                throw new Error(`Ожидался аргумент \`${branch.getArgumentName(name)}\``);
            }

            line = this.readLine(tokenLength, line);
            line = this.readLine(Command.spaceReader, line);
        }

        return {
            line,
            output: await branch.executeable.call(bot, msg, parsedValues as any, input),
        };
    }
}
