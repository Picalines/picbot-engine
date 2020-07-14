import { Command } from "../Info";

export default {
    name: 'prefix',

    description: 'Команда управления префиксами на сервере',
    group: 'Настройки',
    permissions: ['MANAGE_GUILD'],
    examples: [
        '`!prefix` даст список префиксов бота на сервере',
        '`!prefix add ~` добавит `~` в список префиксов бота',
        '`!prefix rm ~` удалит `~` из списка префиксов бота',
    ],

    execute: ({ message, executor, bot, read: { member, word }, isEOL }) => {
        const prefixes = bot.prefixes.guild(message.guild);

        if (isEOL()) {
            const strList = prefixes.list.map(p => `\`${p}\``).join(', ');
            message.reply(`список моих префиксов на этом сервере: ${strList}`);
            return
        }

        const operation = word();
        switch (operation) {
            default: throw new Error(`unsupported prefix operation '${operation}'`);
            case 'add':
                const newPref = word();
                if (prefixes.add(newPref)) {
                    message.reply(`новый префикс команд: \`${newPref}\``);
                }
                else {
                    message.reply(`невозможно добавить такой префикс`);
                }
                break;
            case 'rm':
                const oldPref = word();
                if (prefixes.remove(oldPref)) {
                    message.reply(`префикс \`${oldPref}\` успешно удалён из списка`);
                }
                else {
                    message.reply(`невозможно удалить префикс \`${oldPref}\``);
                }
                break;
        }
    },
} as Command