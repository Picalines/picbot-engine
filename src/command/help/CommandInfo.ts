import { MessageEmbed } from "discord.js";
import { CommandContext } from "../Context.js";
import { capitalize, orderedList } from "../../utils/index.js";
import { Command } from "../Command.js";
import { helpEmbedTerms } from "./embedTerms/Terms.js";

const backtickList = (list: readonly string[]) => list.map(el => `\`${el}\``).join(', ');

export const embedCommandInfo = (embed: MessageEmbed, command: Command<any>, helpContext: CommandContext<any>) => {
    const commandInfo = helpContext.translate(command.infoTerms);
    const embedLabel = helpContext.translate(helpEmbedTerms);

    embed.setTitle(embedLabel.infoAboutCommand({ command: command.name }));

    if (command.aliases) {
        embed.addField(embedLabel.aliases, backtickList(command.aliases));
    }

    embed.addField(embedLabel.description, commandInfo.description);

    if (command.arguments) {
        const argList: string[] = [];

        for (let i = 0; i < command.arguments.length; i++) {
            argList[i] = capitalize((commandInfo as any)[`argument_${i}_description`]);
        }

        embed.addField(embedLabel.arguments, orderedList(...argList));
    }

    const tutorial = commandInfo.tutorial;
    if (tutorial) {
        embed.addField(embedLabel.tutorial, tutorial);
    }

    const permissions = command.permissions.toArray();
    if (permissions.length) {
        embed.addField(embedLabel.permissions, backtickList(permissions));
    }
}
