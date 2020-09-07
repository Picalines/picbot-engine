import { Command } from "../../command/Command";

export default new Command({
    name: 'setgreeting',
    
    description: 'Устанавливает сообщение, которое бот будет писать новым участникам сервера в системном канале',
    group: 'Настройки',
    
    permissions: ['MANAGE_GUILD'],
    
    syntax: '<remainingText:greeting=>',
    
    examples: [
        '`!setgreeting Здравствуй, @member!` Бот напишет: "Здравствуй, @Test!"',
        '`!setgreeting Привет` Бот напишет: "Привет, @Test"',
    ],
    
    execute: async ({ message, bot: { database }, args: { greeting } }) => {
        const data = await database.getGuildData(message.guild);
        
        if (!greeting) {
            data.deleteProperty('greeting');
            await message.reply('приветствие отключено');
            return;
        }
        
        if (!greeting.includes('@member')) {
            greeting += ', @member';
        }
        
        data.setProperty('greeting', greeting);
        await message.reply('новое приветствие успешно установлено');
    },
});
