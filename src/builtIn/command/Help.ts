import { GuildMember, MessageEmbed } from "discord.js";
import { Command } from "../../command/Command";
import { CommandInfo } from "../../command/Info";
import { Bot } from "../../Bot";

const formatList = (list: string[]) => list.map(el => `\`${el}\``).join(', ');

const defaulGroup = 'Другое';

const makeCommandsList = (bot: Bot, embed: MessageEmbed, requester: GuildMember) => {
    embed.setTitle('Список команд бота');

    const groupedCommands = bot.commands.getGrouped(defaulGroup);

    for (const [group, commands] of groupedCommands) {
        const availableCommands = commands.filter(c => c.hasPermissions(bot, requester));
        if (availableCommands.length) {
            const commandNames = availableCommands.map(c => c.info.name);
            embed.addField(group, formatList(commandNames));
        }
    }
}

const makeCommandInfo = (embed: MessageEmbed, info: CommandInfo) => {
    embed.setTitle(`Информация о команде \`${info.name}\``);

    if (info.aliases) {
        embed.addField('Алиасы', formatList(info.aliases as any));
    }

    embed.addField('Описание', info.description || '*Отсутствует*');

    if (info.syntax) {
        embed.addField('Синтаксис', `\`${info.syntax}\``);
    }

    if (info.examples) {
        embed.addField('Примеры использования', info.examples.map(e => '- ' + e).join('\n'));
    }

    if (info.permissions) {
        embed.addField('Права доступа', formatList(info.permissions as any));
    }
}

export default new Command({
    name: 'help',

    description: 'Помощь по командам бота',
    group: 'Информация',

    syntax: '<word:commandName=>',
    examples: [
        '`!help` даст список команд',
        '`!help test` даст информацию о команде `test`'
    ],

    execute: ({ message, bot, args: { commandName } }): Promise<any> => {
        const embed = new MessageEmbed().setColor(0x45ff83);

        if (!commandName) {
            makeCommandsList(bot, embed, message.member);
        }
        else {
            makeCommandInfo(embed, bot.commands.getByName(commandName).info);
        }

        return message.reply({ embed });
    }
});
