# picbot-engine

Библиотека для лёгкого написания дискорд бота на JavaScript

Главная цель - повысить читабельность кода команд, а также улучшить опыт разработки (*VSCode подсвечивает все типы данных*)

Все функции API дискорда библиотека берёт из [discord.js](https://github.com/discordjs/discord.js) (версия 12 и выше!)

[Документация](https://picalines.github.io/picbot-engine/)

## Главный файл

`src/index.js`
```js
const { Client } = require('discord.js');
const { Bot } = require('picbot-engine');

const client = new Client();

const bot = new Bot(client, {
    token: 'token.txt',
    tokenType: 'file',
    fetchPrefixes: ['picbot.'], // стандартные префиксы бота
});

bot.load(); // начнёт загрузку бота
```

Бот загружает команды и другие штуки из папок src/{commands,...}. Эти пути можно изменить в настройках бота (`loadingPaths`)

## Примеры команд

Все команды будем писать в папке `src/commands`

### Ping

`src/commands/ping.js`
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

`src/commands/sum.js`
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

`src/commands/sum.js`
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

`src/commands/ban.js`
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

В библиотеку встроена только команда `help`. Остальные примеры базовых команд смотрите в README и [picbot-9](https://github.com/Picalines/picbot-9)

## Система событий

У бота есть свои события, обработчики которых можно писать в сторонних файлах

`src/events/guildMemberMessage.js`
```js
const { BotEventListener } = require('picbot-engine');

module.exports = new BotEventListener(bot => bot.events, 'guildMemberMessage', message => {
    /*
    Первым аргументом мы указываем функцию, которая достаёт "хранилище событий"
    Вместо bot.events можно указать, например, bot.clientEvents для событий discord.js

    Второй аргумент - имя события

    Третий - слушатель события, обрабатывающий логику
    Если объявить слушатель через function, вам будет доступно this
    В данном случае this будет ботом
    */

    message.reply('pong!');
});
```

## Чтение аргументов

Для чтения аргументов библиотека использует специальные "функции чтения"

Функция чтения примает строку ввода пользователя и внешние данные (*контекст*). Вернуть он должен либо информацию об аргументе (его длину в строке ввода и переведённое значение), либо ошибку.

Бот не хранит какой-то конкретный список таких функций внутри себя. Эти функции можно объявить хоть в коде самой команды, однако гораздо чаще вы будете импортировать их напрямую из библиотеки.

Вот список встроенных функций для чтения аргументов (их документация раписана в `src/builtIn/reader/...`):

* `remainingTextReader` - читает весь оставшийся текст в сообщении (использует String.trim)

* `memberReader` - читает упоминание участника сервера

* `textChannelReader` - читает упоминание текстового канала

* `roleReader` - читает упоминание роли

* `numberReader('int' | 'float', [min, max])` - возвращает функцию чтения числа
    - `'int'` - строго целое число, `'float'` - дробное
    - `[min, max]` - отрезок, в котором находится число. По стандарту он равен `[-Infinity, Infinity]`

* `wordReader` - читает слово (последовательность символов до пробела)

* `stringReader` - читает строку в кавычках или апострофах

* `keywordReader(...)` - читает ключевые слова.
    - `keywordReader('add', 'rm')` - прочитает либо `add`, либо 'rm', либо кинет ошибку
    - `keywordReader('a', 'b', 'c', 'd', ...)`

* `optionalReader(otherReader, defaultValue)` - делает аргумент необязательным
    - `otherReader` - другая функция чтения
    - `defaultValue` - стандартное значение аргумента. Если не указать, библиотека подставит `null`

* `mergeReaders(reader_1, reader_2, ...)` - соединяет несколько функций чтения в одну
    - `mergeReaders(memberReader, numberReader('int'))` -> [GuildMember, number]

* `repeatReader(reader, times)` - вызывает функцию чтения `reader` `times` раз

* `restReader(reader)` - использует функцию чтения до конца команды
    - `restReader(memberReader)` - прочитает столько упоминаний, сколько введёт пользователь
    - `restReader(memberReader, 3)` - кинет ошибку, если пользователь введёт меньше 3-х упоминаний

## Кастомные аргументы команд

Выше я описал концепцию функций чтения. Логично, что вы можете реализовать свои собственные функции чтения. Тут я приведу простой пример функции, которая прочитает кастомный класс `Vector`

`src/vector.js`
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

`src/commands/vectorSum.js`
```js
const { vectorReader } = require('../vector');

module.exports = new Command({
    name: 'vectorsum',

    description: 'Пишет сумму введённых векторов',

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

### Свойства

Представим, что вы делаете команду `warn`. Она должна увеличивать счётчик warn'ов у указанного участника. Как только этот счётчик достигнет некой отметки, которая, например, настраивается отдельной командой `setmaxwarns`, бот забанит этого участника.

Сначала мы объявим `свойства` для базы данных:

`src/properties/warns.js`
```js
const { Property, NumberPropertyAccess } = require('picbot-engine');

// счётчик warn'ов у каждого участника сервера

module.exports = new Property({
    key: 'warns',                        // уникальное название свойства в базе данных
    entityType: 'member',                // тип сущности, у которой есть свойство ('member' / 'guild')
    defaultValue: 0,                     // стандартное кол-во warn'ов
    validate: warns => warns >= 0,       // функция валидации. Кол-во warn'ов не может быть меньше 0 
    accessorClass: NumberPropertyAccess, // об этом ниже
});
```

`src/properties/maxWarns.js`
```js
const { Property, NumberPropertyAccess } = require('picbot-engine');

// максимальное кол-во warn'ов у каждого сервера

const maxWarnsProperty = new Property({
    key: 'maxWarns',
    entityType: 'guild',
    defaultValue: 3,
    validate: maxWarns => maxWarns > 0,
    accessorClass: NumberPropertyAccess,
});
```

Теперь сделаем команду warn:
`src/commands/warn.js`
```js
const { Command } = require('picbot-engine');

const warnsProperty = require('../properties/warns');
const maxWarnsProperty = require('../properties/maxWarns');

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

        /*
        У обоих свойств мы ставили параметр accessorClass на NumberPropertyAccess.
        Это было нужно, чтобы у 'объектов доступа' был метод increase,
        который увеличивает значение свойства как с оператором +=

        По стандарту (если не указывать accessorClass) у объекта доступа
        есть методы value и set (прочитать и записать новое значение).
        Метод increase у NumberPropertyAccess на самом деле просто использует
        set и value, а нужен только для упрощения кода.
        */

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
`src/commands/setMaxWarns.js`
```js
const { Command } = require('picbot-engine');

const maxWarnsProperty = require('../properties/maxWarns');

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

        // функция database.accessProperty синхронная, а await нам нужен для вызова set.
        // команда кинет исключение, если пользователь введёт значение меньше 3 (validate)
        await database.accessProperty(guild, maxWarnsProperty).set(newMaxWarns);

        await message.reply(`Максимальное кол-во предупреждений на сервере теперь \`${newMaxWarns}\``);
    },
});
```

### Селекторы

Потом мы резко захотели сделать поиск по предупреждённым участникам сервера. Для этого в библиотеке есть *селекторы*

`src/selectors/minWarns.js`
```js
const { EntitySelector } = require('picbot-engine');

const warnsProperty = require('../properties/warns');

module.exports = new EntitySelector({
    entityType: 'member', // кого ищем

    variables: {
        minWarns: Number, // параметр minWarns будем читать из аргументов
    },

    expression: q => q.gte(warnsProperty, q.var('minWarns')), // 'boolean' выражение
    /*
    Это выражение можно мысленно представить в виде стрелочной функции:
    member => member.warns >= minwarns

    Однако представлены они не так для оптимизации под разные виды баз данных

    Доступные операторы:

    gte - GreaterThanEquals - >=
    gt - GreaterThan - >
    lt - <, lte - <=
    eq - ==
    and - &&, or - ||, not - !

    Пример сложного выражения:
    q => q.and(
        q.eq(xpProperty, 0),
        q.gt(warnsProperty, 1)
    )
    */
});
```

и используем селектор в команде

`src/commands/findwarned.js`
```js
const { Command, ArgumentSequence, optionalReader, numberReader } = require('picbot-engine');

const minWarnsSelector = require('../selectors/minWarns');

module.exports = new Command({
    name: 'findwarned',

    description: 'Ищет предупреждённых участников',

    arguments: new ArgumentSequence(
        {
            name: 'minWarns',
            description: 'Минимальное кол-во варнов',
            reader: optionalReader(numberReader('int', [1, Infinity]), 1),
        }
    ),

    execute: async ({ message, database, args: [minWarns] }) => {
        const selected = await database.selectEntities(minWarnsSelector, {
            manager: message.guild.members, // если искать сервера, то нужно указать client.guilds
            throwOnNotFound: new Error('Ничего не найдено'), // если не указать, selected может быть пустым
            variables: { minWarns }, // переменные для селектора
            maxCount: 10, // максимальное
            filter: m => !m.permissions.has('ADMINISTRATOR'), // фильтрует участника перед выборкой
        });

        await message.reply(selected.map(m => m.displayName).join(', '))
    },
});

```

### Итог

А теперь главное. Весь код команд и свойств никак не зависит от базы данных, которую выберет пользователь.

По стандарту в библиотеке реализована простая база данных на json, которая сохраняет и загружает все данные из локальной папки `database` (не забудьте добавить в `.gitignore`!). Однако кроме json вы можете реализовать свою базу данных через класс `BotDatabaseHandler`. Я не буду здесь приводить примеров, *потому что лень*. В сурс коде (`src/database/Handler.ts`) уже расписаны нужные для работы функции.
