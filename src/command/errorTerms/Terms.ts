import { TermCollection } from "../../translator/index.js";

export const commandErrorTerms = new TermCollection({
    notEnoughPermissions: [
        'executor', 'command', 'requiredPermissions',
        ({ executor, command, requiredPermissions }) => `member ${executor} can't use command '${command}'. Required permissions: ${requiredPermissions}`,
    ],
});
