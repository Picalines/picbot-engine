import { BaseOption, CommandOptions, SubCommandGroupOption, SubCommandOption, ValueOption } from "./Option.js";
import { OptionType, OptionTypeToValue } from "./OptionType.js";

type GroupTupleBy<Tuple extends readonly any[], Key extends keyof Tuple[number]> = { [K in Tuple[number][Key]]: Extract<Tuple[number], { [KK in Key]: K }> & Tuple[number] };

type GroupOptionsByName<Options extends readonly BaseOption<OptionType>[]> = GroupTupleBy<[...Options], 'name'>;

type RequiredOptions<Options extends readonly ValueOption[]> = Options[number] & { required: true; };

type NotRequiredOptions<Options extends readonly ValueOption[]> = Options[number] & { required: false; };

export type ParsedCommandOptions<Options extends CommandOptions> =
    Options extends readonly ValueOption[]
    ? {
        readonly [N in RequiredOptions<Options>['name']]: OptionTypeToValue<
            (RequiredOptions<Options> & { name: N; })['type']
        >
    } & {
        readonly [N in NotRequiredOptions<Options>['name']]?: OptionTypeToValue<
            (NotRequiredOptions<Options> & { name: N; })['type']
        >
    }
    : Options extends readonly SubCommandOption[]
    ? {
        readonly [N in keyof GroupOptionsByName<Options>]?: ParsedCommandOptions<GroupOptionsByName<Options>[N]['options']>
    }
    : Options extends readonly SubCommandGroupOption[]
    ? {
        readonly [N in keyof GroupOptionsByName<Options>]?: ParsedCommandOptions<GroupOptionsByName<Options>[N]['options']>
    }
    : never;
