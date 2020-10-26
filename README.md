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

### Работа с базой данных

Представим, что вы делаете команду `warn`. Она должна увеличивать счётчик warn'ов у указанного участника. Как только этот счётчик достигнет некой отметки, которая, например, настраивается отдельной командой `setmaxwarns`, бот забанит этого участника.

Сначала мы объявим `свойства` для базы данных:
```js
const { Property, NumberPropertyAccess } = require('picbot-engine');

// счётчик warn'ов у участников сервера
const warnsProperty = new Property({
    key: 'warns', // уникальное название свойства в базе данных
    entityType: 'member', // тип сущности, у которой есть свойство ('member' / 'guild')
    defaultValue: 0, // стандартное кол-во warn'ов у любого участника сервера
    validate: warns => warns >= 0, // функция валидации. Кол-во warn'ов не может быть меньше 0 
    accessorClass: NumberPropertyAccess, // об этом ниже
});

// максимальное кол-во warn'ов на сервере
const maxWarnsProperty = new Property({
    key: 'maxWarns',
    entityType: 'guild',
    defaultValue: 3,
    validate: maxWarns => maxWarns > 0,
    accessorClass: NumberPropertyAccess,
});
```

Потом мы должны указать эти свойства в настройках бота
```js
const { warnsProperty, maxWarnsProperty } = require('./properties');

const client = new Client();

const bot = new Bot(client, {
    database: {
        definedProperties: [
            warnsProperty, maxWarnsProperty
        ]
    },
});
```

Если учитывать, что все свойства мы будем объявлять в файле `properties.js`, то их добавление в настройки можно упростить:
```js
const properties = require('./properties');

const bot = new Bot(new Client(), {
    database: {
        definedProperties: Object.values(properties),
    },
});
```

Теперь сделаем команду warn:
```js
// commands/warn.js

const { Command } = require('picbot-engine');
const { warnsProperty, maxWarnsProperty } = require('../properties');

const warnCommand = new Command({
    name: 'warn',
    permissions: ['BAN_MEMBERS'],

    description: 'Предупреждает участника сервера',
    group: 'Администрирование',

    syntax: '<member:target>',
    examples: [
        '`warn @Test` кинет предупреждение участнику @Test',
    ],

    execute: async ({ message, args: { target }, bot: { database } }) => {
        // database.accessProperty даёт доступ к чтению / записи значения свойства
        // (будем говорить, что accessProperty возвращает объект доступа)
        const targetWarns = database.accessProperty(target, warnsProperty);
        const maxWarns = database.accessProperty(target.guild, maxWarnsProperty);

        // у обоих свойств мы ставили параметр accessorClass на NumberPropertyAccess
        // это было нужно, чтобы у 'объектов доступа' был метод increase,
        // который увеличивает значение свойства как с оператором +=

        // По стандарту (если не указывать accessorClass) у объекта доступа
        // есть методы value и set (прочитать и записать новое значение).
        // Метод increase у NumberPropertyAccess на самом деле просто использует
        // set и value, а нужен только для упрощения кода.

        const newTargetWarns = await targetWarns.increase(1);
        const maxWarnsValue = await maxWarns.value();

        if (newTargetWarns >= maxWarnsValue) {
            const reason = `Слишком много предупреждений (${newTargetWarns})`;
            await target.ban({ reason });
            await message.reply('участник сервера был успешно забанен по причине: ' + reason.toLowerCase());
            return;
        }

        await message.reply(`участник сервера получил предупрежение (${newTargetWarns}/${maxWarnsValue})`);
    },
});

module.exports = warnCommand;

// index.js

const warnCommand = require('./commands/warn');

bot.commands.register(warnCommand);
```

и команда `setmaxwarns`:
```js
// commands/setmaxwarns.js

const { Command } = require('picbot-engine');
const { maxWarnsProperty } = require('../properties');

const setMaxWarnsCommand = new Command({
    name: 'setmaxwarns',
    permissions: ['MANAGE_GUILD'],

    description: 'Ставит максимальное кол-во предупреждений для участников сервера',
    group: 'Администрирование',

    syntax: '<number:newMaxWarns>',
    examples: [
        '`setmaxwarns 10` поставит максимальное кол-во предупреждений на 10',
    ],

    execute: async ({ message, executor: { guild }, args: { newMaxWarns }, bot: { database } }) => {
        if (newMaxWarns < 1) {
            throw new Error('Максимальное кол-во предупреждений не может быть меньше 1');
        }

        // функция database.accessProperty синхронная, а await нам нужен для вызова set
        await database.accessProperty(guild, maxWarnsProperty).set(newMaxWarns);

        await message.reply(`Максимальное кол-во предупреждений на сервере теперь \`${newMaxWarns}\``);
    },
});

module.exports = setMaxWarnsCommand;

// index.js

const setMaxWarnsCommand = require('./commands/setmaxwarns');

bot.commands.register(setMaxWarnsCommand);
```

А теперь главное. Весь код команд и свойств никак не зависит от базы данных, которую выберет разработчик.

По стандарту в библиотеке реализована простая база данных на json, которая сохраняет и загружает все данные из локальной папки `database` (не забудьте добавить в `.gitignore`!). Однако кроме json вы можете реализовать свою базу данных через интерфейс `BotDatabaseHandler`. Я не буду здесь приводить примеров, *потому что лень*. В сурс коде (`src/database/Handler.ts`) уже расписаны нужные для работы функции.
