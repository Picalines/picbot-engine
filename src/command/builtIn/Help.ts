import { MessageEmbed, GuildMember } from "discord.js";
import { CommandStorage } from "../Storage";
import { Command } from "../Info";

const formatList = (list: string[]) => list.map(el => `\`${el}\``).join(', ');

const defaulGroup = 'Другое';

function makeCommandsList(embed: MessageEmbed, { permissions }: GuildMember, commands: CommandStorage) {
    embed.setTitle('Список команд бота');

    const groupedCommands: Record<string, Command[]> = {};
    for (const command of commands) {
        if (command.permissions && permissions.missing(command.permissions as any).length) {
            continue
        }

        let group = command.group || defaulGroup;
        if (groupedCommands[group]) {
            groupedCommands[group].push(command);
        }
        else {
            groupedCommands[group] = [ command ];
        }
    }

    for (const [group, commands] of Object.entries(groupedCommands)) {
        embed.addField(group, formatList(commands.map(c => c.name)));
    }
}

function makeCommandInfo(embed: MessageEmbed, command: Command) {
    embed.setTitle(`Информация о команде \`${command.name}\``);

    if (command.aliases) {
        embed.addField('Алиасы', formatList(command.aliases as any));
    }

    embed.addField('Описание', command.description || '*Отсутствует*');

    if (command.examples) {
        embed.addField('Примеры использования', command.examples.map(e => '- ' + e).join('\n'));
    }

    if (command.permissions) {
        embed.addField('Права доступа', formatList(command.permissions as any));
    }
}

export default {
    name: 'help',

    description: 'Помощь по командам бота',
    group: 'Информация',
    examples: [
        '`!help` даст список команд',
        '`!help test` даст информацию о команде `test`'
    ],

    execute: ({ message, read: { remainingText }, isEOL, bot: { commands } }) => {
        const embed = new MessageEmbed().setColor(0x45ff83);

        const commandName = isEOL() ? '' : remainingText();
        if (!commandName) {
            makeCommandsList(embed, message.member, commands);
        }
        else {
            makeCommandInfo(embed, commands.getByName(commandName));
        }

        message.reply(embed);
    }
} as Command
