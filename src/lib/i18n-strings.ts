import en from "../../locales/en/common.json";

/** English interface strings (locales/en/common.json). Safe to import outside a request. */
export type Strings = typeof en;
export type StringKey = keyof Strings;
export const englishStrings: Strings = en;
