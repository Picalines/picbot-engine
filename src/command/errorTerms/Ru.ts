import { TranslationCollection } from "../../translator/index.js";
import { commandErrorTerms } from "./Terms.js";

export default new TranslationCollection({
    terms: commandErrorTerms,
    locale: 'ru',
    translations: {
        notEnoughPermissions: ({ executor, command, requiredPermissions }) => `${executor} не может использовать команду '${command}'. Необходимые права: ${requiredPermissions}`,
    },
})
