import { CommandInteraction } from "discord.js";
import { Overwrite, PromiseVoid } from "../utils/index.js";
import { CommandContext } from "./Context.js";
import { Bot } from "../bot/index.js";
import { CommandOptions } from "./option/Option.js";

interface CommandExecuteable<Options extends CommandOptions = []> {
    (this: Command, context: CommandContext<Options>): PromiseVoid;
}

export interface CommandInfo<Options extends CommandOptions = []> {
    readonly name: string;
    readonly description: string;
    readonly options?: Options;
}

interface CommandInfoArgument<Options extends CommandOptions = []> {
    readonly execute: CommandExecuteable<Options>;
}

export class Command {
    private constructor(
        readonly name: string,
        readonly description: string,
        readonly executeable: CommandExecuteable<CommandOptions>,
        readonly options?: CommandOptions
    ) {
        Object.freeze(this);
    }

    public static create<Options extends CommandOptions = []>(definition: Overwrite<CommandInfo<Options>, CommandInfoArgument<Options>>): Command {
        const { name, description, execute, options } = definition;

        // TODO: too complex expression?
        //@ts-ignore
        return new Command(name, description, execute, options);
    }

    async execute(bot: Bot, interaction: CommandInteraction): Promise<CommandContext<CommandOptions> | Error> {
        try {
            const context = new CommandContext(bot, this, interaction);

            await this.executeable.call(this, context);

            return context;
        }
        catch (thrown: unknown) {
            return thrown instanceof Error ? thrown : new Error(String(thrown));
        }
    }
}
