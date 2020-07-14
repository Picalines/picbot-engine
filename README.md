# picbot-engine

Библиотека для лёгкого написания дискорд бота на JavaScript

Все функции API дискорда библиотека берёт из [discord.js](https://github.com/discordjs/discord.js)

[Документация](https://picalines.github.io/picbot-engine/)

### Важно!

Проект находится на ранней стадии разработки. Если и использовать, то только на свой страх и риск

Скачать библиотеку сейчас можно только из *этого* репозитория. Позже планируется выход на npm

## Примеры кода

### Команды

#### Ping

```js
const { Bot } = require('picbot-engine');

const bot = new Bot(); // обёртка Client из discord.js

bot.prefixes.global.set('picbot.'); // Префиксы для всех серверов (глобальные)

// Префиксы для одного сервера:
// bot.prefixes.guild(guild).set('!', '~');
// bot.prefixes.guild({ id: 'id сервера' }).set('.', '?');

bot.commands.register('ping', ({ message }) => {
    message.reply('pong!');
});

bot.loginFromFile('./token.txt');
// Прочитает токен бота из файла token.txt в папке бота.
// Простой аналог из discord.js: bot.login('TOKEN')
```

#### Сложение двух чисел

```js
bot.commands.register('sum', ({ message, read: { number } }) => {
    const [a, b] = [number(), number()];
    message.reply(a + b);
});
```

#### Ban

```js
bot.commands.register('ban', async ({ message, read: { member, remainingText }, isEOL }) => {
    const target = member();
    if (message.member.id == target.id) {
        throw new Error('Нельзя забанить самого себя!');
    }
    if (!target.bannable) {
        throw new Error('Я не могу забанить этого участника сервера :/');
    }

    let reason = 'Злобные админы :/';
    if (!isEOL()) { // есть ли ещё аргументы в сообщении
        reason = remainingText();
    }

    await target.ban({ reason });
    await message.reply(`**${target.displayName}** успешно сослан в Сибирь`);
});
```

#### Информация для help

```js
bot.commands.register('ban', {
    permissions: ['BAN_MEMBERS'],
    aliases: ['kill'],

    description: 'Банит участника сервера',
    group: 'Администрирование',
    examples: [
        '`ban @Test` забанит участника @Test',
        '`ban @Test спам` забанит @Test по причине "спам"',
    ],

    execute: async ({ message, read }) => {
        // ... код команды ...
    },
});
```

У бота есть встроенная команда `help`, которая может показать все эти данные в embed'е

### События discord.js

```js
bot.client.on('событие discord.js', () => {
    // ...
});
```

### Встроенные аргументы команд

* `number` - число. Оно может быть целым / дробным, положительным / отрицательным
* `member` - упоминание участника сервера
* `role` - упоминание роли на сервере
* `textChannel` - упоминание текстового канала
* `remainingText` - оставшийся текст команды

### Кастомные аргументы команд

```js
const { Bot, ReadRegex } = require('picbot-engine');

// ...

bot.commandArguments.register('pos', userInput => {
    const pos = ReadRegex('{\\s*\\d+\\s*,\\s*\\d+\\s*}', userInput);
    if (!pos) {
        return { isError: true, error: 'notFound' };
    }

    const [x, y] = pos.match(/\d+/g).map(Number);

    return {
        isError: false,
        value: {
            length: pos.length,
            parsedValue: { x, y },
        },
    };
});

// ...

bot.commands.register('goto', ({ message, read: { pos } }) => {
    const { x, y } = pos();
    message.reply(`шагаю на клетку ${x}-${y}!`);
});
```
