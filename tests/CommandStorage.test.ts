import { Command } from '../src/command/Command';
import { CommandStorage } from '../src/command/Storage';
import { NonEmptyArray } from '../src/utils';

const emptyExecuteable = () => {};

const makeEmptyCommand = (name: string) => new Command({ name, execute: emptyExecuteable });

describe('get by name test', () => {
    const commands = new CommandStorage();

    const aliases: NonEmptyArray<string> = ['main2', 'second', 'wow', 'test'];

    const command = new Command({
        name: 'main',
        execute: emptyExecuteable,
        description: 'test command',
        aliases,
        permissions: ['MANAGE_GUILD'],
    });

    commands.register(command);

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
                    expect(fromGet.info.name).toEqual('main');
                });

                test('description', () => {
                    expect(fromGet.info.description).toEqual('test command');
                });

                test('aliases', () => {
                    expect(fromGet.info.aliases).toEqual(aliases);
                });

                test('permissions', () => {
                    expect(fromGet.info.permissions).toEqual(['MANAGE_GUILD']);
                });
            });
        });
    };

    testDataEquality('main');
    aliases.forEach(testDataEquality);
});

describe('commands list tests', () => {
    const commands = new CommandStorage();

    test('empty', () => {
        let commandsList = commands.list;
        expect(commandsList.length).toEqual(0);
    });

    test('length', () => {
        for (let i = 0; i < 3; i++) {
            commands.register(makeEmptyCommand(String(i)));
        }
        expect(commands.list.length).toEqual(3);
    });

    test('aliases', () => {
        let oldLength = commands.list.length;
        commands.register(new Command({
            name: '999',
            aliases: ['9999', '99999', '-1'],
            execute: emptyExecuteable,
        }));
        expect(commands.list.length).toEqual(oldLength + 1);
    });
});
