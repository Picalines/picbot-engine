import { ArgumentSequence } from "../../command/Argument/Sequence";
import { Command } from "../../command/Definition";
import { numberReader } from "../reader";

export const clearCommand = new Command({
    name: 'clear',

    permissions: ['MANAGE_MESSAGES'],

    description: 'Удаляет N сообщений',
    group: 'Администрирование',

    arguments: new ArgumentSequence(
        {
            name: 'count',
            description: 'Количество сообщений для очистки',
            reader: numberReader('int', [1, Infinity]),
        },
    ),

    examples: [
        '`clear 10` удалит 10 сообщений"',
    ],

    execute: async ({ message: { channel }, args: [count] }) => {
        await channel.bulkDelete(count + 1);
    },
});
