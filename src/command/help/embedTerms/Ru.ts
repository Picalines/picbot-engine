import { TranslationCollection } from "../../../translator/index.js";
import { helpEmbedTerms } from "./Terms.js";

export default new TranslationCollection({
    terms: helpEmbedTerms,
    locale: 'ru',
    translations: {
        botCommandsList: 'Список команд',
        showMoreCommandInfo: 'Используйте `!help <command>` для подробной информации о команде',
        infoAboutCommand: ({ command }) => `Информация о команде \`${command}\``,
        aliases: 'Алиасы',
        description: 'Описание',
        arguments: 'Аргументы',
        tutorial: 'Как использовать',
        permissions: 'Нужные права',
    }
});
