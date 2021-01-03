import { MessageEmbed } from "discord.js";
import { helpEmbedTerms } from "./EmbedTerms";
import { AnyCommand } from "../Command";
import { CommandContext } from "../Context";
import { capitalize, orderedList } from "../../utils";

const backtickList = (list: readonly string[]) => list.map(el => `\`${el}\``).join(', ');

export const embedCommandInfo = (embed: MessageEmbed, command: AnyCommand, helpContext: CommandContext<any>) => {
    const commandInfo = helpContext.translator(command.terms);
    const embedLabel = helpContext.translator(helpEmbedTerms);

    embed.setTitle(embedLabel('infoAboutCommand', { command: command.name }));

    if (command.aliases) {
        embed.addField(embedLabel('aliases'), backtickList(command.aliases));
    }

    embed.addField(embedLabel('description'), commandInfo('description'));

    if (command.arguments) {
        const argList: string[] = [];

        for (let i = 0; i < command.arguments.length; i++) {
            argList[i] = capitalize(commandInfo(`argument_${i}_description` as const));
        }

        embed.addField(embedLabel('arguments'), orderedList(...argList));
    }

    const tutorial = commandInfo('tutorial');
    if (tutorial) {
        embed.addField(embedLabel('tutorial'), tutorial);
    }

    const permissions = command.permissions.toArray();
    if (permissions.length) {
        embed.addField(embedLabel('permissions'), backtickList(permissions));
    }
}
