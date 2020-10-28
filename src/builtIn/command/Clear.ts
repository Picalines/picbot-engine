import { Command } from "../../command/Definition";

export default new Command({
    name: 'clear',

    permissions: ['MANAGE_MESSAGES'],

    description: 'Удаляет N сообщений',
    group: 'Администрирование',

    syntax: '<number:count>',
    examples: [
        '`clear 10` удалит 10 сообщений"',
    ],

    execute: async ({ message: { channel }, args: { count } }) => {
        if (count > 0) {
            await channel.bulkDelete(count + 1);
        }
    }
});
