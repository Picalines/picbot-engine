import { Command } from "../../command/Definition";

export default new Command({
    name: 'prefix',

    description: 'Команда управления префиксами на сервере',
    group: 'Настройки',
    permissions: ['MANAGE_GUILD'],

    syntax: '<word:operation=> <word:prefix=>',
    examples: [
        '`!prefix` даст список префиксов бота на сервере',
        '`!prefix add ~` добавит `~` в список префиксов бота',
        '`!prefix rm ~` удалит `~` из списка префиксов бота',
    ],

    execute: async ({ message, bot, args: { operation, prefix } }) => {
        const prefixes = bot.database.accessProperty(message.guild, bot.prefixesProperty);

        if (!operation) {
            const strList = (await prefixes.value()).map(p => `\`${p}\``).join(', ');
            await message.reply(`список моих префиксов на этом сервере: ${strList}`);
            return;
        }

        switch (operation) {
            default: throw new Error(`unsupported prefix operation '${operation}'`);
            case 'add':
                if (prefix && await prefixes.add(prefix)) {
                    await message.reply(`новый префикс команд: \`${prefix}\``);
                }
                else {
                    await message.reply(`невозможно добавить такой префикс`);
                }
                break;
            case 'remove':
            case 'rm':
                if (prefix && await prefixes.remove(prefix)) {
                    await message.reply(`префикс \`${prefix}\` успешно удалён из списка`);
                }
                else {
                    await message.reply(`невозможно удалить такой префикс`);
                }
                break;
        }
    },
});
