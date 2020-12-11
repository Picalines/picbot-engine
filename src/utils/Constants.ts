import { ClientEvents } from "discord.js";

export const ClientEventNames: (keyof ClientEvents)[] = [
    'channelCreate',
    'channelDelete',
    'channelPinsUpdate',
    'channelUpdate',
    'debug',
    'warn',
    'disconnect',
    'emojiCreate',
    'emojiDelete',
    'emojiUpdate',
    'error',
    'guildBanAdd',
    'guildBanRemove',
    'guildCreate',
    'guildDelete',
    'guildUnavailable',
    'guildIntegrationsUpdate',
    'guildMemberAdd',
    'guildMemberAvailable',
    'guildMemberRemove',
    'guildMembersChunk',
    'guildMemberSpeaking',
    'guildMemberUpdate',
    'guildUpdate',
    'inviteCreate',
    'inviteDelete',
    'message',
    'messageDelete',
    'messageReactionRemoveAll',
    'messageReactionRemoveEmoji',
    'messageDeleteBulk',
    'messageReactionAdd',
    'messageReactionRemove',
    'messageUpdate',
    'presenceUpdate',
    'rateLimit',
    'ready',
    'invalidated',
    'roleCreate',
    'roleDelete',
    'roleUpdate',
    'typingStart',
    'userUpdate',
    'voiceStateUpdate',
    'webhookUpdate',
    'shardDisconnect',
    'shardError',
    'shardReady',
    'shardReconnecting',
    'shardResume',
];
