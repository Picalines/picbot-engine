import * as Arguments from "./Readers";
import { GuildMember, Role, TextChannel } from "discord.js";

type DefaultArgumentReadersMap = {
    number: Arguments.ArgumentReader<number>,
    member: Arguments.ArgumentReader<GuildMember>,
    role: Arguments.ArgumentReader<Role>,
    textChannel: Arguments.ArgumentReader<TextChannel>,
    remainingText: Arguments.ArgumentReader<string>,
}

export type ArgumentReaderData = {
    name: string;
    reader: Arguments.ArgumentReader<any>;
};

/**
 * Хранилище типов аргументов
 */
export class ArgumentReaderStorage implements Iterable<ArgumentReaderData> {
    /**
     * Объект, в котором находятся функции чтения аргументов
     */
    public readers: Record<string, Arguments.ArgumentReader<any>> & DefaultArgumentReadersMap = {
        number: Arguments.ReadNumber,
        member: Arguments.ReadMember,
        role: Arguments.ReadRole,
        textChannel: Arguments.ReadTextChannel,
        remainingText: Arguments.ReadRemainingText,
    };

    /**
     * Добавляет новый тип аргумента команды в память бота.
     * Новый тип появитя в поле `readers`
     * @param typeName имя типа аргумента
     * @param reader функция, читающая аргумент
     */
    public register<T = any>(typeName: string, reader: Arguments.ArgumentReader<T>) {
        if (/^\d+/.test(typeName) || typeName.includes(' ')) {
            throw new Error(`invalid argument type name '${typeName}'`);
        }

        this.readers[typeName] = reader;
    }

    public *[Symbol.iterator]() {
        for (const [name, reader] of Object.entries(this.readers)) {
            yield { name, reader };
        }
    }
}
