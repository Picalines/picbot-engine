import { TranslationCollection } from "../../translator/index.js";
import { unorderedList } from "../../utils/index.js";
import { helpCommand } from "./Help.js";

export default new TranslationCollection({
    terms: helpCommand.infoTerms,
    locale: 'ru',
    translations: {
        group: 'Информация',
        description: 'Показывает список доступных команд или информацию о конретной команде',
        argument_0_description: 'имя или алиас нужной команды',
        tutorial: unorderedList(
            '`!help` покажет список доступных команд',
            '`!help test` покажет информацию о команде `test`',
        ),
    },
});
