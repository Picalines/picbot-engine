import { Command } from "../../command/Definition";

export default new Command({
    name: 'ban',

    permissions: ['BAN_MEMBERS'],

    description: 'Банит участника сервера',
    group: 'Администрирование',

    syntax: '<member:target> <remainingText:reason=Злобные админы :/>',
    examples: [
        '`ban @Test` забанит участника @Test по причине "Злобные админы :/"',
        '`ban @Test спам` забанит @Test по причине "спам"',
    ],

    execute: async ({ message, executor, args: { target, reason } }) => {
        if (executor.id == target.id) {
            throw new Error('Нельзя забанить самого себя!');
        }
        if (!target.bannable) {
            throw new Error('Я не могу забанить этого участника сервера :/');
        }

        await target.ban({ reason });
        await message.reply(`**${target.displayName}** успешно забанен`);
    }
});
