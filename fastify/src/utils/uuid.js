import { convertBase, MAX_BASE } from "./convert-base.js";

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

    return convertBase(noHyphens, 16, MAX_BASE);
  },
  /**
   * @param {string} str
   */
  decode: (str) => {
    let noHyphens = convertBase(str, MAX_BASE, 16);

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

/**
 * https://stackoverflow.com/a/32480941/356849
 * @param {string} value
 * @param {number} from_base
 * @param {number} to_base
 */
function _convertBase(value, from_base, to_base) {
  var range = charset.split("");
  var from_range = range.slice(0, from_base);
  var to_range = range.slice(0, to_base);

  var dec_value = value
    .split("")
    .reverse()
    .reduce(function (carry, digit, index) {
      if (from_range.indexOf(digit) === -1)
        throw new Error(
          "Invalid digit `" + digit + "` for base " + from_base + ".",
        );
      return (carry += from_range.indexOf(digit) * Math.pow(from_base, index));
    }, 0);

  var new_value = "";
  while (dec_value > 0) {
    new_value = to_range[dec_value % to_base] + new_value;
    dec_value = (dec_value - (dec_value % to_base)) / to_base;
  }
  return new_value || "0";
}

/**
 * @param {string} inputStr
 */
function groupsOf4(inputStr) {
  let result = [];

  let current = "";
  for (let char of inputStr) {
    if (current.length === 4) {
      result.push(current);
      current = "";
    }

    current += char;
  }
  if (current.length) {
    result.push(current);
  }

  return result;
}
