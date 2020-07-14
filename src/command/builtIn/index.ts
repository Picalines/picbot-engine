import { BotOptions } from '../../BotOptions';
import { Command } from '../Info';

import HelpCommand from './Help';
import BanCommand from './Ban';
import KickCommand from './Kick';
import PrefixCommand from './Prefix';

export default {
    help: HelpCommand,
    ban: BanCommand,
    kick: KickCommand,
    prefix: PrefixCommand,
} as { [name in keyof BotOptions['commands']['builtIn']]: Command };
