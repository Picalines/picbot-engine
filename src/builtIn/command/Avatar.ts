import { Command } from "../../command/Definition";

export default new Command({
    name: 'avatar',

    description: 'Бот пишет ссылку на аватар участника сервера',
    group: 'Информация',

    syntax: '<member:target=>',

    examples: [
        '`!avatar` напишет ссылку на ваш аватар',
        '`!avatar @Test` напишет ссылку на аватар участника сервера @Test',
    ],

    execute: async ({ message, args: { target } }) => {
        const url = target ? target.user.avatarURL() : message.author.avatarURL();
        await message.reply(url);
    },
});
