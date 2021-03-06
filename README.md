# picbot-engine

Библиотека для лёгкого написания дискорд бота на JavaScript

Главная цель - повысить читабельность кода команд, а также улучшить опыт разработки (*VSCode подсвечивает все типы данных*)

Единственная записимость - [discord.js](https://github.com/discordjs/discord.js) (версия 12 и выше!)

Разрабатывалось это всё на `NodeJS` версии `14.15.4`. Более старые я не тестил, да и не вижу смысла.

В библиотеку встроена только команда `help`, да и ту можно отключить. Примеры базовых команд расписаны в этом README и в [picbot-9](https://github.com/Picalines/picbot-9)

[Документация](https://picalines.github.io/picbot-engine/)

## Главный файл

```js
// src/index.js
import { Client } from "discord.js";
import { Bot } from "picbot-engine";

const client = new Client();

const bot = new Bot(client, {
    token: 'token.txt',
    tokenType: 'file', // библиотека возьмёт токен из 'token.txt'
    fetchPrefixes: ['picbot.'],
});

bot.load(); // начнёт загрузку бота
```

Бот загружает команды и другие штуки из папок `src/{commands,...}`. Эти пути можно изменить в настройках бота (`loadingPaths`)

## *Рекомендации*

**1**. Создайте `jsconfig.json` в корне проекта (либо добавьте эти настройки в `tsconfig.json`, если используете `TypeScript`):
```json5
{
    "compilerOptions": {
        "strict": true,
        "checkJs": true, // не нужно с TypeScript
    }
}
```

Это будет полезно, например, при написании команд - редактор будет проверять необязательные аргументы на значения `null` (подробнее об этом ниже)

**2**. Все примеры в README написаны в стиле ESM (то есть с `import` и `export`). Для этого в `package.json` укажите тип пакета как `модуль`:
```json5
{
    "type": "module",
    "main": "./src/index.js" // путь до главного файла,
}
```

> ⚠ CommonJS (`require`) с этой библиотекой больше не работает.

Запустить проект можно через команду `node .`

## Примеры команд

Все команды будем писать в папке `src/commands`

### Ping

```js
// src/commands/ping.js
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
```

### Сложение двух чисел

```js
// src/commands/sum.js
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

```js
// src/commands/sum.js
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

```js
// src/commands/ban.js
import {
    Command, ArgumentSequence, unorderedList,
    memberReader, remainingTextReader, optionalReader,
} from "picbot-engine";

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

## Система событий

Каждое событие в библиотеке представлено в виде отдельного объекта класса `Event`. Все события некоторой сущности обычно лежат в свойстве с именем `events` (например, события базы данных бота можно найти в `bot.database.events`)

У самого бота есть два свойства с событиями:
 - `clientEvents` - обычные события из `discord.js`
 - `events` - некоторые полезные расширения, которые обычно разработчик прописывает самостоятельно

Пример подключения события в файле:

```js
// src/events/guildMemberMessage.js
import { BotEventListener } from "picbot-engine";

export default new BotEventListener(
    bot => bot.events.guildMemberMessage, // указываем путь до события в боте

    // первым аргументом библиотека вставляет бота
    // все последующие аргументы диктует выбранное выше событие
    (bot, message) => {
        message.reply('pong!');
    }
);
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

### Кастомные аргументы команд

Выше я описал концепцию функций чтения. Логично, что вы можете реализовать свои собственные функции чтения. Тут я приведу простой пример функции, которая прочитает кастомный класс `Vector`

```js
// src/vector.js
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

```js
// src/commands/vectorSum.js
import { Command, ArgumentSequence, restReader } from "picbot-engine";

import { vectorReader } from "../vector.js";

export default new Command({
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

```js
// src/states/warns.js
import { State, numberAccess } from "picbot-engine";

// счётчик warn'ов у каждого участника сервера

export const warnsState = new State({
    name: 'warns',        // уникальное название свойства в базе данных
    entityType: 'member', // тип сущности, у которой есть свойство ('user' / 'member' / 'guild')
    defaultValue: 0,      // изначальное кол-во warn'ов

    // значение счётчика всегда больше или равно нулю. Подробнее об этом ниже
    accessFabric: numberAccess([0, Infinity]),
});

export default warnsState;
```

```js
// src/states/maxWarns.js
import { State, numberAccess } from "picbot-engine";

// максимальное кол-во warn'ов у каждого сервера

export const maxWarnsState = new State({
    name: 'warns',
    entityType: 'guild',
    defaultValue: 3,
    accessFabric: numberAccess([1, Infinity]),
});

export default maxWarnsState;
```

Теперь сделаем команду warn: <br>
```js
// src/commands/warn.js
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
```js
// src/commands/setMaxWarns.js
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
        // это нужно await'ать для совместимости с любыми типами базы данных! (об этом ниже)
        await database.accessState(guild, maxWarnsState).set(newMaxWarns);

        // валидация аргумента сначала пройдёт в numberReader, а потом в numberAccess

        await message.reply(`Максимальное кол-во предупреждений на сервере теперь \`${newMaxWarns}\``);
    },
});
```

#### *Полезный факт!*

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

```js
// src/selectors/minWarns.js
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
```js
// src/commands/findwarned.js
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

    tutorial: '`!findwarned 2` напишет имена участников сервера с 2 варнами и больше',

    execute: async ({ message, database, args: [minWarns] }) => {
        const selected = await database.selectEntities(minWarnsSelector, {
            manager: message.guild.members, // если искать сервера, то нужно указать client.guilds (а если юзеров - client.users)
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

### Итог по БД

А теперь главное. Весь код команд и свойств никак не зависит от базы данных, которую выберет пользователь.

По стандарту в библиотеке реализована простая база данных на json, которая сохраняет и загружает все данные из локальной папки `database` (не забудьте добавить в `.gitignore`!). Однако кроме json вы можете реализовать свою базу данных. Для этого смотрите опцию `databaseHandler` в `./src/bot/Options.ts`. Json'овская БД прописана в `./src/database/json/Handler.ts`. Расписывать данный увлекательный процесс тут я не буду. Уж простите, *лень*.

## Система перевода на другие языки

### `options.fetchLocale`

В настройках есть параметр `fetchLocale`, который отвечает за язык (локаль) на конкретном сервере. По аналогии с `fetchPrefixes` туда можно поставить состояние сервера:

`src/states/locale.js`:
```js
import { State, validatedAccess } from "picbot-engine";

export const supportedLocales = ['ru', 'en'];

/**
 * @param {string} locale
 */
export const isLocaleSupported = (locale) => supportedLocales.includes(locale);

export const localeState = new State({
    name: 'locale',
    entityType: 'guild',
    defaultValue: 'ru',
    accessFabric: validatedAccess(isLocaleSupported),
});

export default localeState;
```

```js
// src/index.js
import localeState from "./states/locale.js";

const bot = new Bot({
    // ...
    fetchLocale: localeState,
    // ...
});
```

Т.е. теперь по стандарту стандартный язык сервера - русский, а опционально мы поддерживаем ещё и английский

>  Cтандартная команда help уже переведена на русский! Просто убедитель, что строка locale - 'ru'

### TermCollection

А теперь я опишу концепт системы перевода. Допустим, что в какой-то команде у нас есть набор ключевых фраз (*терминов*). Сначала мы должны объявить *коллекцию терминов* в папке `./src/terms` (повторюсь, все пути к папкам можно настроить).

```js
// src/terms/prefix.js
import { TermCollection } from "picbot-engine";

export const prefixTerms = new TermCollection({
    prefixWasAdded: ['prefix', ({ prefix }) => `Префикс \`${prefix}\` успешно добавлен`],

    // unableToAddPrefix - кодовое имя термина, которое мы будет использовать в коде команд
    // строками в начале массива мы перечисляем "контекст" термина (переменные из вне нужные для формирования фразы)
    // а в конце указываем функцию, которая использует контекст и выдаёт итоговую строку
    unableToAddPrefix: ['prefix', ({ prefix }) => `Невозможно добавить префкис \`${prefix}\``],

    // в контексте может быть сколько угодно строк!
    test: ['a', 'b', 'c', ({ a, b, c }) => [a, b, c].join(', ')]

    // если термин не требует данных из вне, то он определяется просто как строка
    // (квадратные скобки всё ещё нужны для работы редактора :/)
    randomError: ['Что-то пошло не так :/']
});

// Я пишу так, чтобы редактор мог автоматически импортировать prefixTerms
export default prefixTerms;
```

### TranslationCollection

Теперь переведём эти фразы на *мой ломаный* английский:

```js
// src/translations/en/prefix.js
import { TranslationCollection } from "picbot-engine";

import prefixTerms from "../../terms/prefix.js";

// мы нигде не будем импортировать перевод,
// поэтому достаточно просто export default

export default new TranslationCollection({
    terms: prefixTerms,
    locale: 'en',
    translations: {
        // в переводе мы указываем те же фукнции, использующие контекст терминов для формирования фразы
        unableToAddPrefix: ({ prefix }) => `Unable to add prefix \`${prefix}\``,

        prefixWasAdded: ({ prefix }) => `Prefix \`${prefix}\` was successfully added`,

        // однако для 'константных' терминов нужна только строка
        randomError: 'Something went wrong :/',
    },
});
```

> Если библиотека найдёт два перевода одной TermCollection на один язык, то "победит" последний выбранный перевод

> Вы можете найти в библиотеке переводы help на русский и переопределить их!

### Использование в коде команды

А теперь используем это в команде в воображаемой `prefix` (полностью прописывать её код не буду, сейчас важен только перевод фраз. Полный пример есть в [picbot-9](https://github.com/Picalines/picbot-9))

```js
// src/commands/prefix.js
import { Command } from "picbot-engine";

import prefixTerms from "../terms/prefix.js";

export default new Command({
    name: 'prefix',

    // ...

    execute: ({ message, translate }) => {
        // translate переведёт термины prefixTerms на текущую локаль сервера
        // (либо вторым аргументом можно указать нужный язык)
        // (текущий язык можно достать через аргумент locale)

        // tr - это переводы терминов из TranslationCollection
        // (либо стандартные переводы из TermCollection, если на текущую локаль мы ничего не переводили)
        const tr = translate(prefixTerms);

        // prefixWasAdded - метод tr, которому в аргументе нужно передать контекст термина
        message.reply(tr.prefixWasAdded({ prefix }));

        // 'константные' термины вызывать не нужно
        message.reply(tr.randomError);

        // Библиотека не кидает ошибку, если перевода для термина на язык сервера нет,
        // т.к. у каждого термина всегда есть стандартный перевод
    },
});
```

### Перевод описания команд

Класс `Command` генерирует термины и стандартные переводы в конструкторе. Т.е. для перевода нам нужно создать `TermCollection` с переводом `command.infoTerms`

```js
// src/translations/en/commands/ban.js
import { TranslationCollection, unorderedList } from "picbot-engine";

import banCommand from "../../../commands/ban.js";

export default new TranslationCollection({
    terms: banCommand.infoTerms,
    locale: 'en',
    translations: {
        group: 'Admin',
        description: 'Bans a guild member',

        argument_0_description: 'Victim 😈',
        // argument_1_description,
        // argument_2_description... редактор определит кол-во аргументов!

        tutorial: unorderedList(
            '`!ban @Test` will ban @Test with reason "Angry admins :/"',
            '`!ban @Test spam` will ban @Test with reason "spam"',
        ),
    },
});
```

> Стандартная команда help подхватит все переводы на нужный язык!
