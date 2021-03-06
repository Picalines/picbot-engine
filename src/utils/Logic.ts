export type Failable<R, E> = {
    isError: true,
    error: E,
} | {
    isError: false,
    value: R,
};

export interface ValueParser<From, To, Context, Error> {
    (value: From, context: Context): Failable<To, Error>;
}
