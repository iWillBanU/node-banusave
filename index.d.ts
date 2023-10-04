/**
 * Represents a JSON value.
 */
export type JSONValue = null | boolean | bigint | number | string | JSONValue[] | {[p: string]: JSONValue};

/**
 * Encodes a JSON value into the BanUSave format.
 * @param value The JSON value to encode.
 * @param game A game ID.
 * @returns The encoded BanUSave format.
 */
export function encode(value: JSONValue, game: string): Buffer;

/**
 * Decodes the BanUSave format into a JSON value.
 * @param value The BanUSave format to decode.
 * @returns The decoded JSON value, followed by the game ID.
 */
export function decode(value: Buffer): [JSONValue, string];