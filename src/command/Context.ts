import { GuildMessage } from '../utils';
import { GuildMember } from 'discord.js';
import { CommandHandler } from './Handler';

export class CommandContext {
    public readonly executor: GuildMember;

    private userInput: string;

    constructor(
        public readonly commandHandler: CommandHandler,
        public readonly message: GuildMessage,
        executor?: GuildMember
    ) {
        this.executor = executor || message.member;
        this.userInput = message.content.replace(/^.*\s+/, '');
    }

    public get bot() {
        return this.commandHandler.bot;
    }
}
