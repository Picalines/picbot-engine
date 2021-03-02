import { TranslationCollection } from "../../../translator/index.js";
import { helpEmbedTerms } from "./Terms.js";

export default new TranslationCollection({
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
    }
});
