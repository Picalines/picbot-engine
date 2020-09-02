import { CommandExecuteable, Command } from '../src/command/Info';
import { CommandStorage } from '../src/command/Storage';
import { NonEmptyArray } from '../src/utils';
import { ArgumentReaderStorage } from '../src/command/argument/Storage';

const emptyCommand: CommandExecuteable = () => {};

const argumentReaders = new ArgumentReaderStorage();

describe('name tests', () => {
    const commands = new CommandStorage(argumentReaders);

    test('space', () => {
        const name = 'test b';
        expect(() => commands.register(name, emptyCommand)).toThrowError(`invalid command name '${name}'`);
    });

    test('empty string', () => {
        expect(() => commands.register('', emptyCommand)).toThrowError("invalid command name ''");
    });

    test('normal', () => {
        const name = 'test';
        expect(() => commands.register(name, emptyCommand)).not.toThrowError(`invalid command name '${name}'`);
    });
});

describe('get by name test', () => {
    const commands = new CommandStorage(argumentReaders);

    const aliases: NonEmptyArray<string> = ['main2', 'second', 'wow', 'test'];

    commands.register('main', {
        execute: emptyCommand,
        description: 'test command',
        aliases,
        permissions: ['MANAGE_GUILD'],
    });

    test('not found', () => {
        expect(() => commands.getByName('other')).toThrowError("command 'other' not found");
    });

    const testDataEquality = (name: string) => {
        describe(`alias '${name}'`, () => {
            let fromGet: Command;

            test('found', () => {
                expect(() => {
                    fromGet = commands.getByName(name);
                }).not.toThrowError(`command '${name}' not found`);
            });

            describe(`data equality`, () => {
                test('name', () => {
                    expect(fromGet.name).toEqual('main');
                });

                test('executeable', () => {
                    expect(fromGet.execute).toBe(emptyCommand);
                });

                test('description', () => {
                    expect(fromGet.description).toEqual('test command');
                });

                test('aliases', () => {
                    expect(fromGet.aliases).toEqual(aliases);
                });

                test('permissions', () => {
                    expect(fromGet.permissions).toEqual(['MANAGE_GUILD']);
                });
            });
        });
    };

    testDataEquality('main');
    aliases.forEach(testDataEquality);
});

describe('commands list tests', () => {
    const commands = new CommandStorage(argumentReaders);

    test('empty', () => {
        let commandsList = commands.list;
        expect(commandsList.length).toEqual(0);
    });

    test('length', () => {
        for (let i = 0; i < 3; i++) {
            commands.register(String(i), emptyCommand);
        }
        expect(commands.list.length).toEqual(3);
    });

    test('aliases', () => {
        let oldLength = commands.list.length;
        commands.register('999', {
            aliases: ['9999', '99999', '-1'],
            execute: emptyCommand,
        });
        expect(commands.list.length).toEqual(oldLength + 1);
    });
});
