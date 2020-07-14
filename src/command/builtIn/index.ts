import { BotOptions } from '../../BotOptions';
import { Command } from '../Info';

import HelpCommand from './Help';
import BanCommand from './Ban';
import KickCommand from './Kick';

export default {
    help: HelpCommand,
    ban: BanCommand,
    kick: KickCommand,
} as { [name in keyof BotOptions['commands']['builtIn']]: Command };
