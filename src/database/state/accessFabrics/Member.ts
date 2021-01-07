import { Guild, GuildMember } from 'discord.js';
import { StateAccess } from '../Access';

const idRegex = /\d+/;

const isMember = (entity => 'guild' in entity) as (e: Guild | GuildMember) => e is GuildMember;

const getMember = (entity: Guild | GuildMember, id: string) => (isMember(entity) ? entity.guild : entity).member(id);

export const memberAccess = (allowSelf = false) => (access: StateAccess<string>, entity: Guild | GuildMember) => ({
    ...access,

    async member() {
        const id = await access.value();
        return getMember(entity, id);
    },

    async set(id: string | null) {
        id = String(id);
        if (!idRegex.test(id)) {
            id = 'null';
        }

        if (id != 'null') {
            const refedMember = getMember(entity, id);

            if (!refedMember) {
                throw new Error(`unknown guild member with id ${id}`);
            }

            if (isMember(entity) && entity.id == id && !allowSelf) {
                throw new Error(`self member reference is not allowed`);
            }
        }

        await access.set(id);
    },
});
