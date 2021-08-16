import { Command } from "../Command.js";
import { ArgumentSequence, optionalReader, wordReader } from "../argument/index.js";
import { MessageEmbed } from "discord.js";
import { assert, unorderedList } from "../../utils/index.js";
import { embedCommandList } from "./CommandList.js";
import { embedCommandInfo } from "./CommandInfo.js";

export const helpCommand = new Command({
    name: 'help',

    description: 'Shows list of available commands or information about a specific command',
    group: 'Information',

    arguments: new ArgumentSequence(
        {
            description: 'name or alias of the command',
            reader: optionalReader(wordReader, null),
        }
    ),

    tutorial: unorderedList(
        '`!help` shows list of available commands',
        '`!help test` shows information about the `test` command'
    ),

    execute: async (context) => {
        const { message, executor, bot, args: [commandName] } = context;

        const embed = new MessageEmbed().setColor(0x45ff83);

        if (!commandName) {
            embedCommandList(bot, embed, message.member, context);
        }
        else {
            const command = bot.commands.get(commandName);
            assert(command, `Команда '${commandName}' не найдена`);
            embedCommandInfo(embed, command, context);
        }

        await message.channel.send({ content: executor.toString(), embeds: [embed] })
    }
});
