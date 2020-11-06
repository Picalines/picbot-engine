import { GuildMessage } from "../../../utils";
import { numberReader } from "../Number";

const nullMessage = null as unknown as GuildMessage;

describe('number', () => {
    describe('normal usage', () => {
        test('float', () => {
            expect(numberReader('float')('1.5', nullMessage)).toEqual({ isError: false, value: { length: 3, parsedValue: 1.5 } });
        });
        test('int', () => {
            expect(numberReader('int')('15', nullMessage)).toEqual({ isError: false, value: { length: 2, parsedValue: 15 } });
        });
    });
});
