import * as Arguments from "./Readers";
import { GuildMember, Role, TextChannel } from "discord.js";

type DefaultArgumentReadersMap = {
    number: Arguments.ArgumentReader<number>,
    member: Arguments.ArgumentReader<GuildMember>,
    role: Arguments.ArgumentReader<Role>,
    textChannel: Arguments.ArgumentReader<TextChannel>,
    remainingText: Arguments.ArgumentReader<string>,
}

/**
 * Хранилище типов аргументов
 */
export class ArgumentReaderStorage {
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
     * @param override заменить ли существующий тип аргумента с таким именем
     */
    public register<T = any>(typeName: string, reader: Arguments.ArgumentReader<T>, override = false) {
        if (!override && this.readers[typeName]) {
            throw new Error(`argument type name '${typeName}' is already taken`);
        }
        if (/^\d+/.test(typeName) || typeName.includes(' ')) {
            throw new Error(`invalid argument type name '${typeName}'`);
        }

        this.readers[typeName] = reader;
    }
}
