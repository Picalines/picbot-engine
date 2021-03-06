import { TermCollection } from "../../../translator/index.js";

export const helpEmbedTerms = new TermCollection({
    botCommandsList: ['List of commands'],
    showMoreCommandInfo: ['Use `!help <command>` to see more information about command'],
    infoAboutCommand: ['command', ({ command }) => `Information about command \`${command}\``],
    aliases: ['Aliases'],
    description: ['Description'],
    arguments: ['Arguments'],
    tutorial: ['How to use'],
    permissions: ['Required permissions'],
});
