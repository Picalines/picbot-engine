import { MessageEmbed, GuildMember, EmbedField } from "discord.js";
import { helpEmbedTerms } from "./EmbedTerms.js";
import { CommandContext } from "../Context.js";
import { Bot } from "../../bot/index.js";

export const embedCommandList = (bot: Bot, embed: MessageEmbed, requester: GuildMember, context: CommandContext<any>) => {
    const embedLabel = context.translate(helpEmbedTerms);

    embed.setTitle(embedLabel.botCommandsList);

    const groupFields = new Map<string, EmbedField>();

    for (const command of bot.commands) {
        if (!command.canBeExecutedBy(requester)) {
            continue;
        }

        const { group } = context.translate(command.terms);

        let field = groupFields.get(group);
        if (!field) {
            field = { name: group, value: '', inline: false };
            groupFields.set(group, field);
        }

        field.value += (field.value.length > 0 ? ', ' : '') + `\`${command.name}\``;
    }

    embed.addFields([...groupFields.values()]);
}
