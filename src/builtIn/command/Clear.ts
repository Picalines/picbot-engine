import { numberReader } from "../../command/Argument/Readers";
import { Command } from "../../command/Definition";

export const clearCommand = new Command(
    {
        name: 'clear',

        permissions: ['MANAGE_MESSAGES'],

        description: 'Удаляет N сообщений',
        group: 'Администрирование',

        arguments: [
            {
                name: 'count',
                description: 'Количество сообщений для очистки',
                reader: numberReader('int', [1, Infinity]),
            },
        ],

        examples: [
            '`clear 10` удалит 10 сообщений"',
        ],
    },

    async ({ message: { channel }, args: [count] }) => {
        await channel.bulkDelete(count + 1);
    },
);
