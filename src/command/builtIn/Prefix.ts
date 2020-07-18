import { Command } from "../Info";

export default {
    name: 'prefix',

    description: 'Команда управления префиксами на сервере',
    group: 'Настройки',
    permissions: ['MANAGE_GUILD'],

    syntax: '<word:operation=_> <word:prefix=_>',
    examples: [
        '`!prefix` даст список префиксов бота на сервере',
        '`!prefix add ~` добавит `~` в список префиксов бота',
        '`!prefix rm ~` удалит `~` из списка префиксов бота',
    ],

    execute: ({ message, bot, args: { command: operation, prefix } }) => {
        const prefixes = bot.prefixes.guild(message.guild);

        if (!operation) {
            const strList = prefixes.list.map(p => `\`${p}\``).join(', ');
            message.reply(`список моих префиксов на этом сервере: ${strList}`);
            return
        }

        switch (operation) {
            default: throw new Error(`unsupported prefix operation '${operation}'`);
            case 'add':
                if (prefixes.add(prefix)) {
                    message.reply(`новый префикс команд: \`${prefix}\``);
                }
                else {
                    message.reply(`невозможно добавить такой префикс`);
                }
                break;
            case 'rm':
                if (prefixes.remove(prefix)) {
                    message.reply(`префикс \`${prefix}\` успешно удалён из списка`);
                }
                else {
                    message.reply(`невозможно удалить префикс \`${prefix}\``);
                }
                break;
        }
    },
} as Command
