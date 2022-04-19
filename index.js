/**
 * Represents JSON value.
 * @typedef {null | boolean | bigint | number | string | JSONValue[] | {[p: string]: JSONValue}} JSONValue
 */

const crypto = require("crypto");

/**
 * Encodes a value
 * @param {JSONValue} value The value to encode
 * @returns {Buffer} The encoded value
 * @private
 */
function encodeValue(value) {
    let encoded;
    switch (typeof value) {
        case "boolean":
            encoded = Buffer.alloc(1);
            encoded.writeUint8(value ? 0x02 : 0x01, 0);
            break;
        case "bigint":
            encoded = Buffer.alloc(9);
            encoded.writeUint8(0x10, 0);
            encoded.writeBigInt64BE(value, 1);
            break;
        case "number":
            encoded = Buffer.alloc(9);
            encoded.writeUint8(0x20, 0);
            encoded.writeDoubleBE(value, 1);
            break;
        case "string":
            encoded = Buffer.alloc(Buffer.byteLength(value) + 2);
            encoded.writeUint8(0x30, 0);
            encoded.write(value, 1);
            encoded.writeUint8(0x00, encoded.length - 1);
            break;
        case "object":
            if (Array.isArray(value)) {
                encoded = encodeArray(value);
            } else if (value === null) {
                encoded = Buffer.alloc(1);
                encoded.writeUint8(0x00, 0);
            } else {
                encoded = encodeObject(value);
            }
            break;
    }

    return encoded;
}

/**
 * Encodes an object
 * @param {{[p: string]: JSONValue}} object The object to encode
 * @returns {Buffer} The encoded object
 * @private
 */
function encodeObject(object) {
    let data = Buffer.alloc(0);
    let temp;

    for (let key in object) {
        temp = Buffer.alloc(Buffer.byteLength(key) + 1);
        temp.write(key, 0);
        temp.writeUint8(0x00, temp.length - 1);
        data = Buffer.concat([data, temp, encodeValue(object[key])]);
    }

    return Buffer.concat([Buffer.from([0x50]), data, Buffer.from([0x00])]);
}

/**
 * Encodes an array
 * @param {JSONValue[]} array The array to decode
 * @returns {Buffer} The encoded array
 */
function encodeArray(array) {
    let data = Buffer.alloc(0);
    for (let value of array) data = Buffer.concat([data, encodeValue(value)]);
    return Buffer.concat([Buffer.from([0x40]), data, Buffer.from([0x00])]);
}

/**
 * Decodes a value
 * @param {Buffer} data The data to decode
 * @returns {[JSONValue, number]} The decoded value and its length
 */
function decodeValue(data) {
    let decoded;
    let length;
    switch (data.readUint8(0)) {
        case 0x00:
            decoded = null;
            length = 1;
            break;
        case 0x01:
        case 0x02:
            decoded = data.readUint8(0) === 0x02;
            length = 1;
            break;
        case 0x10:
            decoded = data.readBigInt64BE(1);
            length = 9;
            break;
        case 0x20:
            decoded = data.readDoubleBE(1);
            length = 9;
            break;
        case 0x30:
            decoded = Buffer.alloc(0);
            for (length = 1; data.readUint8(length) !== 0x00; length++) decoded = Buffer.concat([decoded, data.slice(length, length + 1)]);
            decoded = decoded.toString();
            length++;
            break;
        case 0x40:
            let array = decodeArray(data.slice(1));
            decoded = array[0];
            length = array[1];
            break;
        case 0x50:
            let object = decodeObject(data.slice(1));
            decoded = object[0];
            length = object[1];
            break;
    }

    return [decoded, length];
}

/**
 * Decodes an array
 * @param {Buffer} data The data to decode
 * @returns {[JSONValue[], number]} The decoded array and its length
 */
function decodeArray(data) {
    let array = [];
    let offset = 0;
    while (data.readUint8(offset) !== 0x00) {
        console.log(offset, data.readUint8(offset).toString(16));
        const [value, length] = decodeValue(data.slice(offset));
        array.push(value);
        console.log(value, length);
        offset += length;
    }
    console.log(offset, data.readUint8(offset).toString(16));
    return [array, offset + 2];
}

/**
 * Decodes an object
 * @param {Buffer} data The data to decode
 * @returns {[{[p: string]: JSONValue}, number]} The decoded object and its length
 */
function decodeObject(data) {
    let object = {};
    let offset = 0;
    while (data.readUint8(offset) !== 0x00) {
        let key = Buffer.alloc(0);
        let keyLength = 0;
        for (; data.readUint8(offset + keyLength) !== 0x00; keyLength++) key = Buffer.concat([key, data.slice(offset + keyLength, offset + keyLength + 1)]);
        offset += keyLength + 1;
        const [value, valueLength] = decodeValue(data.slice(offset));
        object[key.toString()] = value;
        offset += valueLength;
        console.log(valueLength, offset);
    }
    return [object, offset + 2];
}

/**
 * Encodes a JSON value into the BanUSave format.
 * @param {JSONValue} object The JSON value to encode.
 * @returns {Buffer} The encoded BanUSave format.
 */
function encode(object) {
    let body = encodeValue(object);
    return Buffer.concat([Buffer.from("BANUSAVE"), body, crypto.createHash("sha256").update(body).digest()]);
}

/**
 * Decodes the BanUSave format into a JSON value.
 * @param {Buffer} buffer The BanUSave format to decode.
 * @returns {JSONValue} The decoded JSON value.
 */
function decode(buffer) {
    if (buffer.length < 41) throw new Error("Invalid buffer length");
    if (buffer.slice(0, 8).toString() !== "BANUSAVE") throw new Error("Invalid buffer header");
    if (crypto.createHash("sha256").update(buffer.slice(8, buffer.length - 32)).digest().toString() !== buffer.slice(buffer.length - 32).toString()) throw new Error("Invalid buffer checksum");
    return decodeValue(buffer.slice(8, buffer.length - 32))[0];
}

module.exports = {encode, decode};