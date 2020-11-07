import { CommandContext } from "../../../command/Context";
import { numberReader } from "../Number";

const context = null as unknown as CommandContext<unknown[]>;

describe('number', () => {
    describe('normal usage', () => {
        test('float', () => {
            expect(numberReader('float')('1.5', context)).toEqual({ isError: false, value: { length: 3, parsedValue: 1.5 } });
        });
        test('int', () => {
            expect(numberReader('int')('15', context)).toEqual({ isError: false, value: { length: 2, parsedValue: 15 } });
        });
    });
});
