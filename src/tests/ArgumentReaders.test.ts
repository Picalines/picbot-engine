import * as Arguments from '../command/argument/Readers';

describe('argument read functions', () => {

    const nullMessage = null as any;

    type ReaderResult<T = undefined> = {
        argumentLength: number,
        parsedValue?: T,
    }

    const noArgumentResult: ReaderResult = {
        argumentLength: 0
    };

    describe('space reader', () => {
        test('basic', () => {
            expect(Arguments.ReadSpace('   test', nullMessage)).toEqual<ReaderResult>({
                argumentLength: 3
            });
        });

        test('empty string', () => {
            expect(Arguments.ReadSpace('', nullMessage)).toEqual<ReaderResult>(noArgumentResult);
        });

        test('no spaces', () => {
            expect(Arguments.ReadSpace('test', nullMessage)).toEqual<ReaderResult>(noArgumentResult);
        });

        test('spaces after word', () => {
            expect(Arguments.ReadSpace('one two  ;)', nullMessage)).toEqual<ReaderResult>(noArgumentResult);
        });
    });

    describe('number reader', () => {
        test('typeof', () => {
            const result = Arguments.ReadNumber('123456', nullMessage);
            expect(typeof result.parsedValue).toBe('number');
        });

        describe('integer', () => {
            test('basic', () => {
                expect(Arguments.ReadNumber('125', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 3,
                    parsedValue: 125,
                });
            });

            test('zero', () => {
                expect(Arguments.ReadNumber('0', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 1,
                    parsedValue: 0,
                });
            });

            test('NaN not readable', () => {
                expect(Arguments.ReadNumber('NaN', nullMessage)).toEqual<ReaderResult>({
                    argumentLength: 0,
                });
                expect(Arguments.ReadNumber('nan', nullMessage)).toEqual<ReaderResult>({
                    argumentLength: 0,
                });
            });

            test('signed', () => {
                expect(Arguments.ReadNumber('+5', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 2,
                    parsedValue: 5,
                });
                expect(Arguments.ReadNumber('-20', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 3,
                    parsedValue: -20,
                });
            });
        });

        describe('float', () => {
            test('basic', () => {
                expect(Arguments.ReadNumber('2.5', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 3,
                    parsedValue: 2.5,
                });
            });

            test('no floating point', () => {
                expect(Arguments.ReadNumber('12', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 2,
                    parsedValue: 12,
                });
            });

            test('zero', () => {
                expect(Arguments.ReadNumber('0.0', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 3,
                    parsedValue: 0,
                });
            });

            test('zero floating part', () => {
                expect(Arguments.ReadNumber('0.0000', nullMessage)).toEqual<ReaderResult<number>>({
                    argumentLength: 6,
                    parsedValue: 0,
                });
            });
        });
    });

});
