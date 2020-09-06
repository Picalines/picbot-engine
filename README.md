# picbot-engine

Библиотека для лёгкого написания дискорд бота на JavaScript

Все функции API дискорда библиотека берёт из [discord.js](https://github.com/discordjs/discord.js) (версия 12 и выше!)

[Документация](https://picalines.github.io/picbot-engine/)

## Примеры кода

### Команды

#### Ping

```js
const { Client } = require('discord.js');
const { Bot } = require('picbot-engine');

const client = new Client();

const bot = new Bot(client, {
    guild: {
        defaultPrefixes: ['picbot.'], // стандартные префиксы для новых серверов
    },
});

bot.commands.register('ping', ({ message }) => {
    message.reply('pong!');
});

bot.loginFromFile('./token.txt');
// Прочитает токен бота из файла token.txt в папке бота.
// Простой аналог из discord.js: bot.login('TOKEN')
```

#### Сложение двух чисел

Ручное чтение аргументов:
```js
bot.commands.register('sum', ({ message, read: { number } }) => {
    const [a, b] = [number(), number()];
    message.reply(a + b);
});
```

Чтение аргументов через `синтаксис`:
```js
bot.commands.register('sum', {
    syntax: '<number:first> <number:second>',
    execute: ({ message, args: { first, second } }) => {
        message.reply(first + second);
    },
});
```

#### Ban

```js
bot.commands.register('ban', {
    syntax: '<member:target> <remainingText:reason=Злобные админы :/>',
    execute: async ({ message, executor, args: { target, reason } }) => {
        if (executor.id == target.id) {
            throw new Error('Нельзя забанить самого себя!');
        }
        if (!target.bannable) {
            throw new Error('Я не могу забанить этого участника сервера :/');
        }
        await target.ban({ reason });
        await message.reply(`**${target.displayName}** успешно сослан в Сибирь`);
    },
});
```

Код команды взят напрямую из библиотеки. Команда `ban` встроена в бота

#### Информация для help

```js
bot.commands.register('ban', {
    permissions: ['BAN_MEMBERS'],
    aliases: ['kill'],

    description: 'Банит участника сервера',
    group: 'Администрирование',

    syntax: '<member:target> <remainingText:reason>',
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

### Подключение команд из других файлов

`commands/ping.js`
```js
const { Command } = require('picbot-engine');

module.exports = new Command({
    name: 'ping',
    execute: ({ message }) => {
        message.reply('pong!');
    },
});
```

`index.js`
```js
const pingCommand = require('./commands/ping');

bot.commands.register(pingCommand);
```

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
* `word` - слово (последовательность символов до пробела)

### Встроенные команды

У бота есть список встроенных команд:
* `help` - помощь по всем командам
* `ban` - банит участника сервера
* `kick` - кикает участника сервера
* `prefix` - управление префиксами на сервере

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

// использование через read
bot.commands.register('goto', async ({ message, read: { pos } }) => {
    const { x, y } = pos();
    await message.reply(`шагаю на клетку ${x}-${y}!`);
});

// через синтаксис
bot.commands.register('goto', {
    syntax: '<pos:destination>',
    execute: async ({ message, args: { destination: { x, y } } }) => {
        await message.reply(`шагаю на клетку ${x}-${y}!`);
    }
});

```
