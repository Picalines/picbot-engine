# picbot-engine

Библиотека для лёгкого написания дискорд бота на JavaScript

Главная цель - повысить читабельность кода команд, а также улучшить опыт разработки (*VSCode подсвечивает все типы данных*)

Единственная записимость - [discord.js](https://github.com/discordjs/discord.js) (версия 12 и выше!)

Разрабатывалось это всё на `NodeJS` версии `14.15.4`. Более старые я не тестил, да и не вижу смысла.

В README расписаны основные примеры работы с библиотекой. Также есть [документация по всему модулю](https://picalines.github.io/picbot-engine/)

## Главный файл

`src/index.js`
```js
import { Client } from "discord.js";
import { Bot } from "picbot-engine"; // require тоже работает!

const client = new Client();

const bot = new Bot(client, {
    token: 'token.txt',
    tokenType: 'file', // библиотека возьмёт токен из 'token.txt'
    fetchPrefixes: ['picbot.'],
});

bot.load(); // начнёт загрузку бота
```

Бот загружает команды и другие штуки из папок `src/{commands,...}`. Эти пути можно изменить в настройках бота (`loadingPaths`)

## *Рекомендация*

Создайте `jsconfig.json` в корне проекта (либо добавьте эти настройки в `tsconfig.json`, если используете `TypeScript`):
```json
{
    "compilerOptions": {
        "strict": true,
        "checkJs": true, // не нужно с TypeScript
    }
}
```

Это будет полезно, например, при написании команд - редактор будет проверять необязательные аргументы на значения `null` (подробнее об этом ниже)

## Примеры команд

Все команды будем писать в папке `src/commands`

### Ping

`src/commands/ping.js`
```js
import { Command } from "picbot-engine";

export default new Command({
    name: 'ping',
    group: 'Тестирование',
    description: 'Бот отвечает тебе сообщением `pong!`',

    tutorial: '`!ping` напишет `pong!`',

    execute: ({ message }) => {
        message.reply('pong!');
    },
});

// Если вы пишете в CommonJS:
// module.exports = new Command({ ... });
```

### Сложение двух чисел

`src/commands/sum.js`
```js
import { Command, ArgumentSequence, numberReader, unorderedList } from "picbot-engine";

export default new Command({
    name: 'sum',
    group: 'Математика',
    description: 'Пишет сумму 2 чисел',

    arguments: new ArgumentSequence(
        {
            description: 'Первое число',
            reader: numberReader('float'), // подробнее об этом ниже
        },
        {
            description: 'Второе число',
            reader: numberReader('float'),
        },
    ),

    tutorial: unorderedList( // добавит '•' в начало каждой строки
        '`!sum 3 2` напишет 5',
        '`!sum 5 4` = `9`',
    ),

    execute: ({ message, args: [first, second] }) => {
        message.reply(first + second);
    },
});
```

### Сложение N чисел

`src/commands/sum.js`
```js
import { Command, ArgumentSequence, restReader, numberReader, unorderedList } from 'picbot-engine';

export default new Command({
    name: 'sum',
    group: 'Математика',
    description: 'Пишет сумму N чисел',

    arguments: new ArgumentSequence(
        {
            description: 'Числа',
            reader: restReader(numberReader('float'), 2),
        },
    ),

    tutorial: unorderedList(
        '`!sum 1 2 3 ...` напишет сумму всех введённых чисел',
        '`!sum 1` даст ошибку (нужно минимум 2 числа)',
    ),

    execute: ({ message, args: [numbers] }) => {
        // редактор определит numbers как массив с минимум 2 числами!
        message.reply(numbers.reduce((sum, cur) => sum + cur));
    },
});
```

### Ban

`src/commands/ban.js`
```js
import { Command, ArgumentSequence, memberReader, remainingTextReader, optionalReader, unorderedList } from "picbot-engine";

export default new Command({
    name: 'ban',
    group: 'Администрирование',
    description: 'Банит участника сервера',

    permissions: ['BAN_MEMBERS'],

    arguments: new ArgumentSequence(
        {
            description: 'Жертва 😈',
            reader: memberReader,
        },
        {
            description: 'Причина бана',
            reader: optionalReader(remainingTextReader, 'Злобные админы :/'),
        },
    ),

    tutorial: unorderedList(
        '`ban @Test` забанит @Test по причине "Злобные админы :/"',
        '`ban @Test спам` забанит @Test по причине "спам"',
    ),

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

В библиотеку встроена только команда `help` (*можно отключить*). Остальные примеры базовых команд смотрите в README и [picbot-9](https://github.com/Picalines/picbot-9)

## Система событий

У бота есть свои события, обработчики которых можно писать в сторонних файлах

`src/events/guildMemberMessage.js`
```js
import { BotEventListener } from "picbot-engine";

export default new BotEventListener(bot => bot.events, 'guildMemberMessage', message => {
    /*
    Первым аргументом мы указываем функцию, которая достаёт "хранилище событий"
    Вместо bot.events можно указать, например, bot.clientEvents для событий discord.js

    Второй аргумент - имя события

    Третий - слушатель события, обрабатывающий логику
    Если объявить слушатель через function, вам будет доступно this
    В данном случае this будет ботом, а для bot.clientEvents - клиент API
    */

    message.reply('pong!');
});
```

## Чтение аргументов

Для чтения аргументов библиотека использует специальные "функции чтения"

Функция чтения примает строку ввода пользователя и внешние данные (*контекст*). Вернуть она должна либо информацию об аргументе (его длину в строке ввода и переведённое значение), либо ошибку.

Бот не хранит какой-то конкретный список таких функций внутри себя. Эти функции можно объявить хоть в коде самой команды, однако гораздо чаще вы будете импортировать их напрямую из библиотеки.

Вот список встроенных функций для чтения аргументов:

* `remainingTextReader` - читает весь оставшийся текст в сообщении (использует `String.trim`)

* `memberReader` - упоминание участника сервера

* `textChannelReader` - упоминание текстового канала

* `roleReader` - упоминание роли

* `numberReader('int' | 'float', [min, max])` - возвращает функцию чтения числа
    - `'int'` - строго целое число, `'float'` - дробное
    - `[min, max]` - отрезок, в котором находится число. По стандарту он равен `[-Infinity, Infinity]`

* `wordReader` - слово (последовательность символов до пробела)

* `stringReader` - строку в кавычках или апострофах

* `keywordReader(...)` - ключевые слова.
    - `keywordReader('add', 'rm')` - прочитает либо `add`, либо `rm`, либо кинет ошибку
    - `keywordReader('a', 'b', 'c', 'd', ...)`

* `optionalReader(otherReader, defaultValue)` - делает аргумент необязательным
    - `otherReader` - другая функция чтения
    - `defaultValue` - стандартное значение аргумента. Библиотека подставит его, если вместо аргумента будет получен `EOL` (конец строки команды)

* `mergeReaders(reader_1, reader_2, ...)` - соединяет несколько функций чтения в одну
    - `mergeReaders(memberReader, numberReader('int'))` -> `[GuildMember, number]`

* `repeatReader(reader, times)` - вызывает функцию чтения `times` раз

* `restReader(reader)` - использует функцию чтения до конца команды
    - `restReader(memberReader)` - прочитает столько упоминаний, сколько введёт пользователь (вернёт пустой массив, если ничего не получено)
    - `restReader(memberReader, 3)` - кинет ошибку, если пользователь введёт меньше 3-х упоминаний

## Кастомные аргументы команд

Выше я описал концепцию функций чтения. Логично, что вы можете реализовать свои собственные функции чтения. Тут я приведу простой пример функции, которая прочитает кастомный класс `Vector`

`src/vector.js`
```js
import { parsedRegexReader } from "picbot-engine";

export class Vector {
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

export const vectorReader = parsedRegexReader(/\d+(\.\d*)?\s+\d+(\.\d*)?/, userInput => {
    const [xInput, yInput] = userInput.split(' ');

    const vector = new Vector(parseFloat(xInput), parseFloat(yInput))

    return { isError: false, value: vector };
});
```

`src/commands/vectorSum.js`
```js
import { vectorReader } from "../vector.js";

module.exports = new Command({
    name: 'vectorsum',
    group: 'Геометрия',
    description: 'Пишет сумму введённых векторов',

    arguments: new ArgumentSequence(
        {
            description: 'Векторы',
            reader: restReader(vectorReader, 2),
        },
    ),

    tutorial: '`!vectorsum 2 3 10 5` напишет `{12; 8}`',

    execute: ({ message, args: [vectors] }) => {
        // редактор определил vectors как массив Vector'ов!
        const vectorSum = vectors.reduce((r, c) => r.add(c));
        message.reply(vectorSum.toString());
    },
});
```

## Работа с базой данных

### Состояния

Представим, что вы делаете команду `warn`. Она должна увеличивать счётчик warn'ов у указанного участника. Как только этот счётчик достигнет некой отметки, которая, например, настраивается отдельной командой `setmaxwarns`, бот забанит этого участника.

Сначала мы объявим `состояния` для базы данных:

`src/states/warns.js`
```js
import { State, numberAccess } from "picbot-engine";

// счётчик warn'ов у каждого участника сервера

export default new State({
    name: 'warns',        // уникальное название свойства в базе данных
    entityType: 'member', // тип сущности, у которой есть свойство ('member' / 'guild')
    defaultValue: 0,      // стандартное кол-во warn'ов

    // значение счётчика всегда больше или равно нулю. Подробнее об этом ниже
    accessFabric: numberAccess([0, Infinity]),
});
```

`src/states/maxWarns.js`
```js
import { Property, NumberPropertyAccess } from "picbot-engine";

// максимальное кол-во warn'ов у каждого сервера

export default new State({
    name: 'warns',
    entityType: 'member',
    defaultValue: 0,
    accessFabric: numberAccess([0, Infinity]),
});
```

Теперь сделаем команду warn: <br>
`src/commands/warn.js`
```js
import { Command, ArgumentSequence, memberReader } from "picbot-engine";

import warnsState from "../states/warns.js";
import maxWarnsState from "../states/maxWarns.js";

export default new Command({
    name: 'warn',
    group: 'Администрирование',
    description: 'Предупреждает участника сервера',

    permissions: ['BAN_MEMBERS'],

    arguments: new ArgumentSequence(
        {
            description: 'Жертва',
            reader: memberReader,
        }
    ),

    tutorial: '`warn @Test` кинет предупреждение участнику @Test',

    execute: async ({ message, bot: { database }, args: [target] }) => {
        // database.accessState даёт доступ к чтению / записи значения свойства
        // (будем говорить, что accessState возвращает объект доступа)
        const targetWarns = database.accessState(target, warnsState);
        const maxWarns = database.accessState(target.guild, maxWarnsState);

        const newTargetWarns = await targetWarns.increase(1);
        const maxWarnsValue = await maxWarns.value();

        /*
        У обоих свойств мы ставили параметр accessorFabric на numberAccess.
        Это было нужно, чтобы у 'объектов доступа' был метод increase,
        который увеличивает значение свойства как с оператором +=

        По стандарту (если не указывать accessFabric) у объекта доступа
        есть методы value и set (прочитать и записать новое значение).
        Метод increase у numberAccess на самом деле просто использует
        set и value, а нужен только для упрощения кода.

        Также numberAccess проверяет значения в set (валидация). Первым аргументом
        мы указывали интервал от 0 до ∞, так что warn'ы и maxWarns не могут быть
        отрицательными. Также внутри есть защита от NaN!
        */

        if (newTargetWarns >= maxWarnsValue) {
            const reason = `Слишком много предупреждений (${newTargetWarns})`;
            await target.ban({ reason });
            await message.reply('участник сервера был успешно забанен по причине: ' + reason);
            return;
        }

        await message.reply(`участник сервера получил предупрежение (${newTargetWarns}/${maxWarnsValue})`);
    },
});
```

и команда `setmaxwarns`: <br>
`src/commands/setMaxWarns.js`
```js
import { Command, ArgumentSequence, numberReader } from "picbot-engine";

import maxWarnsState from "../states/maxWarns.js";

export default new Command({
    name: 'setmaxwarns',
    group: 'Администрирование',
    description: 'Ставит максимальное кол-во предупреждений для участников сервера',

    permissions: ['MANAGE_GUILD'],

    arguments: new ArgumentSequence(
        {
            name: 'newMaxWarns',
            description: 'Новое максимальное кол-во предупреждений',
            reader: numberReader('int', [3, Infinity]),
        }
    ),

    tutorial: '`setmaxwarns 10` поставит максимальное кол-во предупреждений на 10',

    execute: async ({ message, database, executor: { guild }, args: [newMaxWarns] }) => {
        // функция database.accessState синхронная, а await нам нужен для вызова set.
        // это нужно await'ать, потому что set может выкинуть исключение!
        await database.accessState(guild, maxWarnsState).set(newMaxWarns);

        await message.reply(`Максимальное кол-во предупреждений на сервере теперь \`${newMaxWarns}\``);
    },
});
```

### *Полезный факт!*

Вы можете объявить состояние префиксов у сервера (`State<'guild', string[]>`), и вставить его в `fetchPrefixes` в настроках бота. Тогда библиотека будет доставать префиксы из БД!

```js
// src/states/prefixes.js
export const prefixesState = new State({
    name: 'prefixes',
    entityType: 'guild',
    defaultValue: ['dev.'],
});

// src/index.js
export const bot = new Bot({
    // ...
    fetchPrefixes: prefixesState
});
```

### Селекторы

Потом мы резко захотели сделать поиск по предупреждённым участникам сервера. Для этого в библиотеке есть *селекторы*

`src/selectors/minWarns.js`
```js
import { EntitySelector } from "picbot-engine";

import warnsState from "../states/warns.js";

export default new EntitySelector({
    entityType: 'member', // кого ищем

    variables: {
        minWarns: Number, // параметр minWarns будем читать из аргументов
    },

    expression: q => q.gte(warnsState, q.var('minWarns')), // 'boolean' выражение
    /*
    Это выражение можно мысленно представить в виде стрелочной функции:
    member => member.warns >= minwarns

    Однако представлены они не так для оптимизации под разные виды баз данных - выражение
    интерпретируется в нужный вид перед использованием. Например, стандартная json
    база данных превращает expression в стрелочную функцию через рекурсию и
    прочие страшные штуки. Все результаты кэшируются по мере необходимости (lazy load)!

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

и используем селектор в команде: <br>
`src/commands/findwarned.js`
```js
import { Command, ArgumentSequence, optionalReader, numberReader } from "picbot-engine";

import minWarnsSelector from "../selectors/minWarns.js";

export default new Command({
    name: 'findwarned',
    group: 'Информация',
    description: 'Ищет предупреждённых участников',

    arguments: new ArgumentSequence(
        {
            description: 'Минимальное кол-во варнов',
            reader: optionalReader(numberReader('int', [1, Infinity]), 1),
        }
    ),

    execute: async ({ message, database, args: [minWarns] }) => {
        const selected = await database.selectEntities(minWarnsSelector, {
            manager: message.guild.members, // если искать сервера, то нужно указать client.guilds
            throwOnNotFound: new Error('Ничего не найдено'), // если не указать, selected может быть пустым
            variables: { minWarns }, // переменные для селектора (не указываются, если переменных нет в самом селекторе)
            maxCount: 10, // максимальное кол-во результатов
            filter: m => !m.permissions.has('ADMINISTRATOR'), // фильтрует участника перед выборкой
        });

        const names = selected.map(m => m.displayName);
        await message.reply(names.join(', '));
    },
});

```

### Итог

А теперь главное. Весь код команд и свойств никак не зависит от базы данных, которую выберет пользователь.

По стандарту в библиотеке реализована простая база данных на json, которая сохраняет и загружает все данные из локальной папки `database` (не забудьте добавить в `.gitignore`!). Однако кроме json вы можете реализовать свою базу данных. Для этого смотрите опцию `databaseHandler` в `./src/bot/Options.ts`. Json'овская БД прописана в `./src/database/json/Handler.ts`. Расписывать данный увлекательный процесс тут я не буду. Уж простите, *лень*.
