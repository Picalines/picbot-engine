import { Command } from "../Command";
import { ArgumentSequence, optionalReader, wordReader } from "../argument";
import { MessageEmbed } from "discord.js";
import { assert, unorderedList } from "../../utils";
import { embedCommandList } from "./CommandList";
import { embedCommandInfo } from "./CommandInfo";
import { TranslationCollection } from "../../translator";

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
        const { message, bot, args: [commandName] } = context;

        const embed = new MessageEmbed().setColor(0x45ff83);

        if (!commandName) {
            embedCommandList(bot, embed, message.member, context);
        }
        else {
            const command = bot.commands.get(commandName);
            assert(command, `Команда '${commandName}' не найдена`);
            embedCommandInfo(embed, command, context);
        }

        await message.reply({ embed });
    }
});

export const helpInfoTranslationRU = new TranslationCollection({
    terms: helpCommand.terms,
    locale: 'ru',
    translations: {
        description: 'Показывает список доступных команд или информацию о конретной команде',
        group: 'Информация',
        tutorial: unorderedList(
            '`!help` покажет список доступных команд',
            '`!help test` покажет информацию о команде `test`',
        ),
        argument_0_description: 'имя или алиас нужной команды',
    },
});
