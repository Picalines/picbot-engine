import { CommandContext } from './Context';
import { GuildMessage } from '../utils';
import { Command } from './Command';
import { Bot } from '../bot';

import {
    NumberReader,
    NumberParser,
    RemainingTextReader,
    MemberMentionReader,
    MemberMentionParser,
    RoleMentionReader,
    RoleMentionParser,
    TextChannelMentionReader,
    TextChannelMentionParser,
    ArgumentReader,
    ArgumentParser
} from '../argument';

type ArgumentHandler<T> = {
    reader: ArgumentReader,
    parser?: ArgumentParser<T>,
}

export class CommandHandler {
    constructor(public readonly bot: Bot) { }

    public readonly argumentHandlers = new Map<string, ArgumentHandler<any>>([
        ['remainingText', {
            reader: new RemainingTextReader()
        }],
        ['number', {
            reader: new NumberReader(),
            parser: new NumberParser(),
        }],
        ['member', {
            reader: new MemberMentionReader(),
            parser: new MemberMentionParser(),
        }],
        ['role', {
            reader: new RoleMentionReader(),
            parser: new RoleMentionParser(),
        }],
        ['textChannel', {
            reader: new TextChannelMentionReader(),
            parser: new TextChannelMentionParser(),
        }],
    ]);

    public async handleMessage(message: GuildMessage, startFrom: number) {
        let content = message.content.slice(startFrom);

        const commandName = content.replace(/\s.*$/, '');
        const command = this.bot.commandStorage.getCommandByName(commandName);

        await this.bot.catchErrorEmbedReply(message, () => {
            const context = new CommandContext(this, message);
            return this.executeCommand(command, context);
        });
    }

    public async executeCommand(command: Command, context: CommandContext) {
        throw new Error('not implemented');
    }
}
