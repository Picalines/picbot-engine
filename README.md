# picbot-engine

Библиотека для лёгкого написания дискорд бота на JavaScript

Главная цель - повысить читабельность кода команд, а также улучшить опыт разработки (*VSCode подсвечивает все типы данных*)

Все функции API дискорда библиотека берёт из [discord.js](https://github.com/discordjs/discord.js) (версия 12 и выше!)

[Документация](https://picalines.github.io/picbot-engine/)

## Логин и загрузка команд

```js
const { Client } = require('discord.js');
const { Bot } = require('picbot-engine');

const client = new Client();

const bot = new Bot(client, {
    guild: {
        defaultPrefixes: ['picbot.'], // стандартные префиксы для новых серверов
    },
});

// Импортирует все команды из папки commands 
bot.commands.requireFolder('commands');

// Прочитает токен бота из файла token.txt и использует в client.login
bot.loginFromFile('token.txt');
```

## Примеры команд

### Ping

`commands/ping.js`
```js
const { Command } = require('picbot-engine');

module.exports = new Command({
    name: 'ping',

    description: 'Бот отвечает тебе сообщением `pong!`',

    execute: ({ message }) => {
        message.reply('pong!');
    },
});
```

### Сложение двух чисел

`commands/sum.js`
```js
const { Command, ArgumentSequence, numberReader } = require('picbot-engine');

module.exports = new Command({
    name: 'sum',

    description: 'Пишет сумму 2 чисел',

    arguments: new ArgumentSequence(
        {
            name: 'first',
            description: 'Первое число',
            reader: numberReader('float'), // подробнее об этом ниже
        },
        {
            name: 'second',
            description: 'Второе число',
            reader: numberReader('float'),
        },
    ),

    examples: [
        '`!sum 3 2` напишет 5',
    ],

    execute: ({ message, args: [first, second] }) => {
        message.reply(first + second);
    },
});
```

### Сложение N чисел

`commands/sum.js`
```js
const { Command, ArgumentSequence, restReader, numberReader } = require('picbot-engine');

module.exports = new Command({
    name: 'sum',

    description: 'Пишет сумму N чисел',

    arguments: new ArgumentSequence(
        {
            name: 'numbers',
            description: 'Числа',
            reader: restReader(numberReader('float'), 2),
        },
    ),

    examples: [
        '`!sum 1 2 3 ...` напишет сумму всех введённых чисел',
        '`!sum 1` даст ошибку (нужно минимум 2 числа)',
    ],

    execute: ({ message, args: [numbers] }) => {
        message.reply(numbers.reduce((sum, cur) => sum + cur));
    },
});
```

### Ban

`commands/ban.js`
```js
const { Command, ArgumentSequence, memberReader, remainingTextReader, optionalReader } = require('picbot-engine');

module.exports = new Command({
    name: 'ban',

    permissions: ['BAN_MEMBERS'],

    description: 'Банит участника сервера',
    group: 'Администрирование',

    arguments: new ArgumentSequence(
        {
            name: 'target',
            description: 'Участник сервера, которого нужно забанить',
            reader: memberReader,
        },
        {
            name: 'reason',
            description: 'Причина бана',
            reader: optionalReader(remainingTextReader, 'Злобные админы :/'),
        },
    ),

    examples: [
        '`ban @Test` забанит @Test по причине "Злобные админы :/"',
        '`ban @Test спам` забанит @Test по причине "спам"',
    ],

    execute: async ({ message, executor, args: [target, reason] }) => {
        if (executor.id == target.id) {
            throw new Error('Нельзя забанить самого себя!');
        }
        if (!target.bannable) {
            throw new Error('Я не могу забанить этого участника сервера :/');
        }

        await target.ban({ reason });
        await message.reply(`**${target.displayName}** успешно забанен`);
    },
});
```

Код команды взят напрямую из библиотеки. Команда `ban` встроена в бота

У бота также есть встроенная команда `help`

Отключить встроенные команды можно через настройки в конструкторе `Bot`

## События discord.js

```js
bot.client.on('событие discord.js', () => {
    // ...
});
```

## Чтение аргументов

Для чтения аргументов библиотека использует специальные "функции чтения"

Функция чтения примает строку ввод пользователя и *внешние данные* (*контекст*). Вернуть он должен либо информацию об аргументе (его длину в строке ввода и переведённое значение), либо ошибку.

Бот не хранит какой-то конкретный список таких функций внутри себя. Эти функции можно объявить хоть в коде самой команды, однако гораздо чаще вы будете импортировать их напрямую из библиотеки.

Вот список встроенных функций для чтения аргументов (их документация раписана в `src/builtIn/reader/...`):

* remainingText - читает весь оставшийся текст в сообщении (использует String.trim)

* memberReader - читает упоминание участника сервера

* textChannelReader - читает упоминание текстового канала

* roleReader - читает упоминание роли

* numberReader('int' | 'float', [min, max]) - возвращает функцию чтения числа
    - 'int' - строго целое число, 'float' - дробное
    - [min, max] - интервал, в котором находится число. По стандарту он равен [-Infinity, Infinity]

* wordReader - читает слово (последовательность символов до пробела)

* stringReader - читает строку в кавычках или опострофах

* keywordReader(...) - читает ключевые слова.
    - keywordReader('add', 'rm') - прочитает либо `add`, либо 'rm', либо кинет ошибку
    - keywordReader('a', 'b', 'c', 'd', ...)

* optionalReader(otherReader, defaultValue) - делает аргумент необязательным
    - otherReader - другая функция чтения
    - defaultValue - стандартное значение аргумента. Если не указать, библиотека подставит `null`

* mergeReaders(reader_1, reader_2, ...) - соединяет несколько функций чтения в одну
    - mergeReaders(memberReader, numberReader('int')) -> [GuildMember, number]

* repeatReader(reader, times) - вызывает функцию чтения `reader` `times` раз

* restReader(reader) - использует функцию чтения до конца команды
    - restReader(memberReader) - прочитает столько упоминаний, сколько введёт пользователь
    - restReader(memberReader, 3) - кинет ошибку, если пользователь введёт меньше 3-х упоминаний

## Встроенные команды

У бота есть список встроенных команд:
* `help` - помощь по всем командам
* `ban` - банит участника сервера
* `kick` - кикает участника сервера
* `prefix` - управление префиксами на сервере
* `avatar` - пишет ссылку на аватар участника сервера
* `clear` - очищает N последних сообщений

## Кастомные аргументы команд

Выше я описал концепцию функций чтения. Логично, что вы можете реализовать свои собственные функции чтения. Тут я приведу простой пример функции, которая прочитает кастомный класс `Vector`

`vector.js`
```js
const { parsedRegexReader } = require('picbot-engine');

class Vector {
    constructor(x, y) {
        this.x = Number(x);
        this.y = Number(y);
    }

    /**
     * @param {Vector} v
     */
    add(v) {
        return new Vector(this.x + v.x, this.y + v.y);
    }

    toString() {
        return `{${this.x}; ${this.y}}`;
    }
}

const vectorReader = parsedRegexReader(/\d+(\.\d*)?\s+\d+(\.\d*)?/, userInput => {
    const [xInput, yInput] = userInput.split(' ');

    const vector = new Vector(parseFloat(xInput), parseFloat(yInput))

    return { isError: false, value: vector };
});

module.exports = {
    Vector,
    vectorReader,
};
```

`commands/vectorSum.js`
```js
module.exports = new Command({
    name: 'vectorsum',

    /* ... */

    arguments: new ArgumentSequence(
        {
            name: 'vectors',
            description: 'Векторы',
            reader: restReader(vectorReader, 2),
        },
    ),

    examples: [
        '`!vectorsum 2 3 10 5` напишет `{12; 8}`',
    ],

    execute: ({ message, args: [vectors] }) => {
        message.reply(vectors.reduce((r, c) => r.add(c)).toString());
    },
});
```

## Работа с базой данных

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
`commands/warn.js`
```js
const { Command } = require('picbot-engine');
const { warnsProperty, maxWarnsProperty } = require('../properties');

module.exports = new Command({
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
```

и команда `setmaxwarns`:
`commands/setMaxWarns.js`
```js
const { Command } = require('picbot-engine');
const { maxWarnsProperty } = require('../properties');

module.exports = new Command({
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
```

А теперь главное. Весь код команд и свойств никак не зависит от базы данных, которую выберет разработчик.

По стандарту в библиотеке реализована простая база данных на json, которая сохраняет и загружает все данные из локальной папки `database` (не забудьте добавить в `.gitignore`!). Однако кроме json вы можете реализовать свою базу данных через интерфейс `BotDatabaseHandler`. Я не буду здесь приводить примеров, *потому что лень*. В сурс коде (`src/database/Handler.ts`) уже расписаны нужные для работы функции.
