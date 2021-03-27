declare var __DEBUG__: boolean;

export const debug = (...args) =>
{
    if (__DEBUG__) console.debug(...args);
}
