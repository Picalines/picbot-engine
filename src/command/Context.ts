import { Command } from "./Command.js";
import { Bot } from "../bot/index.js";
import { CommandOptions, SubCommandGroupOption, SubCommandOption, ValueOption } from "./option/Option.js";
import { CommandInteraction } from "discord.js";
import { ParsedCommandOptions } from "./option/OptionTreeParser.js";
import { OptionType } from "./option/OptionType.js";

export class CommandContext<Options extends CommandOptions> {
    readonly options: ParsedCommandOptions<Options>;

    constructor(
        readonly bot: Bot,
        readonly command: Command,
        readonly interaction: CommandInteraction,
    ) {
        this.options = this.parseOptions();
    }

    get executor() {
        return this.interaction.user;
    }

    get database() {
        return this.bot.database;
    }

    get logger() {
        return this.bot.logger;
    }

    private parseOptions(): ParsedCommandOptions<Options> {
        if (!this.command.options || !this.command.options[0]) {
            return {} as any;
        }

        const { type: topLevelOptionType } = this.command.options[0];

        switch (topLevelOptionType) {
            case OptionType.SubCommandGroup:
                return this.parseSubCommandGroups();

            case OptionType.SubCommand:
                return this.parseSubCommands();

            default:
                return this.parseValueOptions(this.command.options as readonly ValueOption[]);
        }
    }

    private parseSubCommands(): any {
        const currentSubCommand = this.interaction.options.getSubcommand(true);

        const bottomLevelOptions = (this.command.options as readonly SubCommandOption[])
            .find(subCommand => subCommand.name == currentSubCommand)!.options;

        return {
            [currentSubCommand]: this.parseValueOptions(bottomLevelOptions)
        };
    }

    private parseSubCommandGroups(): any {
        const currentSubCommandGroup = this.interaction.options.getSubcommandGroup(true);
        const currentSubCommand = this.interaction.options.getSubcommand(true);

        const bottomLevelOptions = (this.command.options as readonly SubCommandGroupOption[])
            .find(group => group.name == currentSubCommandGroup)!.options
            .find(subCommand => subCommand.name == currentSubCommand)!.options;

        return {
            [currentSubCommandGroup]: { [currentSubCommand]: this.parseValueOptions(bottomLevelOptions) }
        };
    }

    private parseValueOptions(options: readonly ValueOption[]) {
        const values: any = {};

        for (const option of options) {
            const typeName = OptionType[option.type];
            const interactionGetter: (name: string, required: boolean) => any = (this.interaction as any)[`get${typeName}`];
            values[option.name] = interactionGetter.call(this.interaction, option.name, option.required ?? false);
        }

        return values;
    }
}
