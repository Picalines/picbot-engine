import { Command } from "../src/command/Command";
import { CommandInfo } from "../src/command/Info";

const emptyExecuteable = () => { };

const makeEmptyCommand = (info: Omit<CommandInfo, 'execute'>) => new Command({ ...info, execute: emptyExecuteable });

describe('command name test', () => {
    test('space', () => {
        expect(() => makeEmptyCommand({ name: 'test a' })).toThrow("invalid command name 'test a'");
    });

    test('empty string', () => {
        expect(() => makeEmptyCommand({ name: '' })).toThrow("invalid command name ''");
    });

    test('normal', () => {
        expect(() => makeEmptyCommand({ name: 'ban' })).not.toThrow("invalid command name 'ban'");
    });
});

describe('syntax test', () => {
    test('normal', () => {
        expect(() => makeEmptyCommand({ name: 'ban', syntax: '<member:target>' })).not.toThrow();
    });

    test('missing bracket', () => {
        expect(() => makeEmptyCommand({ name: 'ban', syntax: '<member:target' })).toThrow("invalid 'ban' command syntax: <member:target");
    });

    test('empty name', () => {
        expect(() => makeEmptyCommand({ name: 'ban', syntax: '<member:>' })).toThrow("invalid 'ban' command syntax: <member:>");
    });

    test('empty type', () => {
        expect(() => makeEmptyCommand({ name: 'ban', syntax: '<:target>' })).toThrow("invalid 'ban' command syntax: <:target>");
    });

    test('name starting with number', () => {
        expect(() => makeEmptyCommand({ name: 'ban', syntax: '<member:2abc>' })).toThrow("invalid 'ban' command syntax: <member:2abc>");
    });
});
