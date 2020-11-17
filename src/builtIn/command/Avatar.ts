import { ArgumentSequence } from "../../command/Argument/Sequence";
import { Command } from "../../command/Definition";
import { optionalReader, memberReader } from "../reader";

export const avatarCommand = new Command({
    name: 'avatar',

    description: 'Бот пишет ссылку на аватар участника сервера',
    group: 'Информация',

    arguments: new ArgumentSequence(
        {
            name: 'target',
            description: 'Участник сервера, у которого нужно взять аватар',
            reader: optionalReader(memberReader, null),
        },
    ),

    examples: [
        '`!avatar` напишет ссылку на ваш аватар',
        '`!avatar @Test` напишет ссылку на аватар участника сервера @Test',
    ],

    execute: async ({ message, args: [target] }) => {
        const user = target?.user ?? message.author;
        await message.reply(user.avatarURL());
    },
});
