import { base64To16, base16To64 } from "./convert-base.js";

/**
 * The URL allows
 * - 0-9
 * - a-z, A-Z
 * - $, -, _, ., +, !, *, ' (, ),
 *
 * All this combined is base (10 + 26 + 26 + 10) or base (72)
 *
 *
 * our Primary Key is UUIDv4, which is
 *  32 base16 characters, once you remove the `-`
 *
 *  Example:
 *    320684ca-8c22-43fa-884b-db9d687fbe71
 *
 *  This 64 bytes of information ( (16 / 8) * 32 )
 *
 *  To encode 64 bytes of information in the shortest possible text...
 *  We'll use base 64 (a custom URL-compatible equiv)
 *  because 16 fits into 64 4 times, so our resulting string should be 4 times shorter.
 *
 *  Split into groups of 4 characters
 *    3206-84ca-8c22-43fa-884b-db9d-687f-be71
 *
 *  So our resulting string should be 8 characters?
 *
 */

const HYPHENS = [8, 12 + 1, 16 + 2, 20 + 3];

export const compressedUUID = {
  /**
   * @param {string} hex
   */
  encode: (hex) => {
    let noHyphens = hex.replaceAll("-", "").toLowerCase();

    return base16To64(noHyphens);
  },
  /**
   * @param {string} str
   */
  decode: (str) => {
    let noHyphens = base64To16(str);

    let result = noHyphens;

    for (let i of HYPHENS) {
      result = insert(result, i, "-");
    }

    return result;
  },
};

/**
 * @param {string} str
 * @param {number} index
 * @param {string} value
 */
function insert(str, index, value) {
  return str.substr(0, index) + value + str.substr(index);
}
