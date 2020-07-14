import { Command } from "../Info";

const defaultReason = 'Злобные админы :/';

export default {
    name: 'ban',

    permissions: ['BAN_MEMBERS'],

    description: 'Банит участника сервера',
    group: 'Администрирование',
    examples: [
        '`ban @Test` забанит участника @Test по причине ',
        '`ban @Test спам` забанит @Test по причине "спам"',
    ],

    execute: async ({ message, executor, read: { member, remainingText }, isEOL }) => {
        const target = member();

        if (executor.id == target.id) {
            throw new Error('Нельзя забанить самого себя!');
        }
        if (!target.bannable) {
            throw new Error('Я не могу забанить этого участника сервера :/');
        }

        const reason = isEOL() ? defaultReason : remainingText();

        await target.ban({ reason });
        await message.reply(`**${target.displayName}** успешно забанен`);
    }
} as Command