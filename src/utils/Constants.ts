import { ClientEvents } from "discord.js";

export type NonDeprecatedClientEvents = { [Event in Exclude<keyof ClientEvents, 'message' | 'interaction'>]: ClientEvents[Event] };

export const ClientEventNames: readonly (keyof NonDeprecatedClientEvents)[] = Object.freeze([
    'applicationCommandCreate',
    'applicationCommandDelete',
    'applicationCommandUpdate',
    'channelCreate',
    'channelDelete',
    'channelPinsUpdate',
    'channelUpdate',
    'debug',
    'warn',
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
    'guildMemberUpdate',
    'guildUpdate',
    'inviteCreate',
    'inviteDelete',
    'messageCreate',
    'messageDelete',
    'messageReactionRemoveAll',
    'messageReactionRemoveEmoji',
    'messageDeleteBulk',
    'messageReactionAdd',
    'messageReactionRemove',
    'messageUpdate',
    'presenceUpdate',
    'rateLimit',
    'invalidRequestWarning',
    'ready',
    'invalidated',
    'roleCreate',
    'roleDelete',
    'roleUpdate',
    'threadCreate',
    'threadDelete',
    'threadListSync',
    'threadMemberUpdate',
    'threadMembersUpdate',
    'threadUpdate',
    'typingStart',
    'userUpdate',
    'voiceStateUpdate',
    'webhookUpdate',
    'interactionCreate',
    'shardDisconnect',
    'shardError',
    'shardReady',
    'shardReconnecting',
    'shardResume',
    'stageInstanceCreate',
    'stageInstanceUpdate',
    'stageInstanceDelete',
    'stickerCreate',
    'stickerDelete',
    'stickerUpdate',
]);
