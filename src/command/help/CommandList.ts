import { MessageEmbed, GuildMember, EmbedField } from "discord.js";
import { helpEmbedTerms } from "./EmbedTerms";
import { CommandContext } from "../Context";
import { Bot } from "../../bot";

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
