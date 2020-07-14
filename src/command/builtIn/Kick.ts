import { Command } from "../Info";

const defaultReason = 'Злобные админы :/';

export default {
    name: 'kick',

    permissions: ['KICK_MEMBERS'],

    description: 'Кикает участника сервера',
    group: 'Администрирование',
    examples: [
        '`kick @Test` кикнет участника @Test по причине ',
        '`kick @Test спам` кикнет @Test по причине "спам"',
    ],

    execute: async ({ message, executor, read: { member, remainingText }, isEOL }) => {
        const target = member();

        if (executor.id == target.id) {
            throw new Error('Нельзя кикнуть самого себя!');
        }
        if (!target.kickable) {
            throw new Error('Я не могу кикнуть этого участника сервера :/');
        }

        const reason = isEOL() ? defaultReason : remainingText();

        await target.kick(reason);
        await message.reply(`**${target.displayName}** успешно сослан в Сибирь`);
    }
} as Command