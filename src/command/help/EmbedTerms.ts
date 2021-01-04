import { constTerm, TermCollection, TranslationCollection } from "../../translator";

export const helpEmbedTerms = new TermCollection({
    botCommandsList: constTerm('List of commands'),
    infoAboutCommand: {
        context: { command: String },
        translation: ({ command }) => `Information about command \`${command}\``,
    },
    aliases: constTerm('Aliases'),
    description: constTerm('Description'),
    arguments: constTerm('Arguments'),
    tutorial: constTerm('How to use'),
    permissions: constTerm('Required permissions'),
});

export const helpEmbedTranslationsRU = new TranslationCollection({
    terms: helpEmbedTerms,
    locale: 'ru',
    translations: {
        botCommandsList: 'Список команд',
        infoAboutCommand: ({ command }) => `Информация о команде \`${command}\``,
        aliases: 'Алиасы',
        description: 'Описание',
        arguments: 'Аргументы',
        tutorial: 'Как использовать',
        permissions: 'Нужные права',
    },
});
