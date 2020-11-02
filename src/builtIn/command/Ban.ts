import { memberReader, optionalReader, remainingTextReader } from "../../command/Argument/Reader";
import { Command } from "../../command/Definition";

export const banCommand = new Command(
    {
        name: 'ban',

        permissions: ['BAN_MEMBERS'],

        description: 'Банит участника сервера',
        group: 'Администрирование',

        arguments: [
            {
                name: 'target',
                description: 'Участник сервера, которого нужно забанить',
                reader: memberReader,
            },
            {
                name: 'reason',
                description: 'Причина бана',
                reader: optionalReader(remainingTextReader, 'Злобные админы :/'),
            },
        ],

        examples: [
            '`ban @Test` забанит @Test по причине "Злобные админы :/"',
            '`ban @Test спам` забанит @Test по причине "спам"',
        ],
    },

    async ({ message, executor, args: [target, reason] }) => {
        if (executor.id == target.id) {
            throw new Error('Нельзя забанить самого себя!');
        }
        if (!target.bannable) {
            throw new Error('Я не могу забанить этого участника сервера :/');
        }

        await target.ban({ reason });
        await message.reply(`**${target.displayName}** успешно забанен`);
    },
);
