import { MessageEmbed, GuildMember, EmbedField } from "discord.js";
import { CommandContext } from "../Context.js";
import { Bot } from "../../bot/index.js";
import { helpEmbedTerms } from "./embedTerms/Terms.js";
import { Command } from "../Command.js";

export const embedCommandList = (bot: Bot, embed: MessageEmbed, requester: GuildMember, context: CommandContext<any>) => {
    const embedText = context.translate(helpEmbedTerms);

    embed
        .setTitle(embedText.botCommandsList)
        .setDescription('> ' + embedText.showMoreCommandInfo);

    const groupedCommands = [...bot.commands]
        .filter(command => command.canBeExecutedBy(requester))
        .reduce((grouped: Record<string, Command<any>[]>, command) => {
            const { group } = context.translate(command.infoTerms);

            (grouped[group] ??= []).push(command);

            return grouped;
        }, {});

    const fields = Object.entries(groupedCommands)
        .map(([group, commands]) => ({
            name: group,
            value: commands.map(c => `\`${c.name}\``).join(', ')
        }));

    embed.addFields(...fields);
};
