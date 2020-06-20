import { PromiseVoid } from '../utils';
import { CommandContext } from './Context';

export abstract class Command {
    public abstract readonly name: string;
    public readonly aliases: string[] = [];
    public abstract readonly description: string;

    public abstract execute(context: CommandContext): PromiseVoid;

    public validateNames(): boolean {
        const validateName = (name: string) => !name.includes(' ');
        return validateName(this.name) && this.aliases.every(validateName);
    }
}
