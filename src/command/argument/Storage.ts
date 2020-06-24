import * as Arguments from "./Readers";
import { GuildMember, Role, TextChannel } from "discord.js";

type DefaultArgumentReadersMap = {
    number: Arguments.ArgumentReader<number>,
    member: Arguments.ArgumentReader<GuildMember>,
    role: Arguments.ArgumentReader<Role>,
    textChannel: Arguments.ArgumentReader<TextChannel>,
    remainingText: Arguments.ArgumentReader<string>,
}

export class ArgumentReaderStorage {
    public readers: Record<string, Arguments.ArgumentReader<any>> & DefaultArgumentReadersMap = {
        number: Arguments.ReadNumber,
        member: Arguments.ReadMember,
        role: Arguments.ReadRole,
        textChannel: Arguments.ReadTextChannel,
        remainingText: Arguments.ReadRemainingText,
    };

    public register(typeName: string, reader: Arguments.ArgumentReader<any>, override = false) {
        if (!override && this.readers[typeName]) {
            throw new Error(`argument type name '${typeName}' is already taken`);
        }
        if (/^\d+/.test(typeName) || typeName.includes(' ')) {
            throw new Error(`invalid argument type name '${typeName}'`);
        }

        this.readers[typeName] = reader;
    }
}
