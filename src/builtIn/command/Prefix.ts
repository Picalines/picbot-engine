import { keywordReader, optionalReader, wordReader } from "../../command/Argument/Readers";
import { Command } from "../../command/Definition";

export const prefixCommand = new Command(
    {
        name: 'prefix',

        description: 'Команда управления префиксами на сервере',
        group: 'Настройки',
        permissions: ['MANAGE_GUILD'],

        arguments: [
            {
                name: 'operation',
                description: 'Операция с префиксами (list | add | rm)',
                reader: optionalReader(keywordReader('list', 'add', 'rm'), 'list'),
            },
            {
                name: 'prefix',
                description: 'Префикс для добавления (add) / удаления (rm)',
                reader: optionalReader(wordReader, null),
            },
        ],

        examples: [
            '`!prefix` даст список префиксов бота на сервере',
            '`!prefix add ~` добавит `~` в список префиксов бота',
            '`!prefix rm ~` удалит `~` из списка префиксов бота',
        ],
    },

    async ({ message, bot, args: [operation, prefix] }) => {
        const prefixes = bot.database.accessProperty(message.guild, bot.prefixesProperty);

        if (operation == 'list') {
            const strList = (await prefixes.value()).map(p => `\`${p}\``).join(', ');
            await message.reply(`список моих префиксов на этом сервере: ${strList}`);
            return;
        }

        if (!prefix) {
            throw new Error(`для операции ${operation} необходимо указать префикс`);
        }

        switch (operation) {
            default:
                throw new Error(`unsupported prefix operation '${operation}'`);
            case 'add':
                if (await prefixes.add(prefix)) {
                    await message.reply(`новый префикс команд: \`${prefix}\``);
                }
                else {
                    await message.reply(`невозможно добавить такой префикс`);
                }
                break;
            case 'rm':
                if (await prefixes.remove(prefix)) {
                    await message.reply(`префикс \`${prefix}\` успешно удалён из списка`);
                }
                else {
                    await message.reply(`невозможно удалить такой префикс`);
                }
                break;
        }
    }
);
