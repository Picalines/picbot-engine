import { Command } from "../../command/Definition";
import { optionalReader, wordReader } from "../reader";
import { GuildMember, MessageEmbed } from "discord.js";
import { Bot } from "../../Bot";

const formatList = (list: string[]) => list.map(el => `\`${el}\``).join(', ');

const defaulGroup = 'Другое';

const makeCommandsList = (bot: Bot, embed: MessageEmbed, requester: GuildMember) => {
    embed.setTitle('Список команд бота');

    const groupedCommands = bot.commands.grouped(defaulGroup);

    for (const [group, commands] of groupedCommands) {
        const availableCommands = commands.filter(c => requester.permissions.has(c.permissions.bitfield));
        if (availableCommands.length) {
            const commandNames = availableCommands.map(c => c.name);
            embed.addField(group, formatList(commandNames));
        }
    }
}

const makeCommandInfo = <Args extends any[]>(embed: MessageEmbed, command: Command<Args>) => {
    embed.setTitle(`Информация о команде \`${command.name}\``);

    if (command.aliases) {
        embed.addField('Алиасы', formatList(command.aliases as any));
    }

    embed.addField('Описание', command.description);

    if (command.arguments?.length) {
        const argumentInfos = command.arguments.map(arg => `• ${arg.name} - ${arg.description}`);
        embed.addField('Аргументы', argumentInfos.join('\n'));
    }

    if (command.examples) {
        embed.addField('Примеры использования', command.examples.map(e => '• ' + e).join('\n'));
    }

    const permissions = command.permissions.toArray();
    if (permissions.length) {
        embed.addField('Права доступа', formatList(permissions));
    }
}

export const helpCommand = new Command(
    {
        name: 'help',

        description: 'Помощь по командам бота',
        group: 'Информация',

        arguments: [
            {
                name: 'commandName',
                description: 'Имя команды',
                reader: optionalReader(wordReader, null),
            },
        ],

        examples: [
            '`!help` даст список команд',
            '`!help test` даст информацию о команде `test`'
        ],
    },

    async ({ message, bot, args: [commandName] }) => {
        const embed = new MessageEmbed().setColor(0x45ff83);

        if (!commandName) {
            makeCommandsList(bot, embed, message.member);
        }
        else {
            const command = bot.commands.get(commandName);
            if (!command) {
                throw new Error(`Команда '${commandName}' не найдена`);
            }
            makeCommandInfo(embed, command);
        }

        await message.reply({ embed });
    }
);
