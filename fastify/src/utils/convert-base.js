/**
 * NOW: GPL-3.0, 
 *   Modifications:
 *    - TS -> JS
 *    - Simpler (for specific custom base64~ish use case)
 *    - Removed fraction support
 *    - Changed default alphabet
 *    - No Negative number support
 *
 *  ORIGINALLY: https://github.com/ryasmi/baseroo
 *
      MIT License

      Copyright (c) 2023 Ryan Smith

      Permission is hereby granted, free of charge, to any person obtaining a copy
      of this software and associated documentation files (the "Software"), to deal
      in the Software without restriction, including without limitation the rights
      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      copies of the Software, and to permit persons to whom the Software is
      furnished to do so, subject to the following conditions:

      The above copyright notice and this permission notice shall be included in all
      copies or substantial portions of the Software.

      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
**/
const letters = "abcdefghijklmnopqrstuvwxyz"; // * 2 = 52
const digits = "0123456789"; // 52 + 10 = 62
const special = `_.`;
// Adding more characters has diminishing returns on the output length
//const unicode = `    ㄱ ㄲ ㄴ ㄷ ㄸ ㄹ ㅁ ㅂ ㅃ ㅅ ㅆ ㅇ ㅈ ㅉ ㅊ ㅋ ㅌ ㅍ ㅎ
//    ㅏ ㅐ ㅑ ㅒ ㅓ ㅔ ㅕ ㅖ ㅗ ㅘ ㅙ ㅚ ㅛ ㅜ ㅝ ㅞ ㅟ ㅠ ㅡ ㅢ ㅣ
//
//ぁ 	あ 	ぃ 	い 	ぅ 	う 	ぇ 	え 	ぉ 	お 	か 	が 	き 	ぎ 	く
// 	ぐ 	け 	げ 	こ 	ご 	さ 	ざ 	し 	じ 	す 	ず 	せ 	ぜ 	そ 	ぞ 	た
// 	だ 	ち 	ぢ 	っ 	つ 	づ 	て 	で 	と 	ど 	な 	に 	ぬ 	ね 	の 	は
// 	ば 	ぱ 	ひ 	び 	ぴ 	ふ 	ぶ 	ぷ 	へ 	べ 	ぺ 	ほ 	ぼ 	ぽ 	ま 	み
// 	む 	め 	も 	ゃ 	や 	ゅ 	ゆ 	ょ 	よ 	ら 	り 	る 	れ 	ろ 	ゎ 	わ
// 	ゐ 	ゑ 	を 	ん 	ゔ 	ゕ 	ゖ
//`;
const charset = [
  digits,
  letters,
  letters.toUpperCase(),
  special,
  //unicode
]
  .filter(Boolean)
  .join("")
  .split(/\s/)
  .join("");
export const MAX_BASE = charset.length;

/**
 * @param {unknown} digit;
 * @param {unknown} base;
 */
function invalidDigit(digit, base) {
  throw new Error(`Invalid digit '${digit}' for base ${base}.`);
}

/**
 * @param {unknown} ref;
 * @param {unknown} base;
 * @param {unknown} maxBase;
 */
function invalidBase(ref, base, maxBase) {
  throw new Error(`'${ref}' must be between 2 and ${maxBase} not '${base}'.`);
}

const ZERO = BigInt(0);
const ONE = BigInt(1);
const TWO = BigInt(2);

/**
 * @param {bigint} x
 * @param {bigint} y
 * @returns {bigint}
 */
function bigIntPow(x, y) {
  if (y === ZERO) return ONE;
  const p2 = bigIntPow(x, y / TWO);
  if (y % TWO === ZERO) return p2 * p2;
  return x * p2 * p2;
}

const defaultAlphabet = charset;
const defaultAlphabetRange = defaultAlphabet.split("");

/**
 * @param {string} integerValue
 * @param {string[]} fromAlphabet
 * @returns {bigint}
 */
function convertToBase10Integer(integerValue, fromAlphabet) {
  const fromBase = BigInt(fromAlphabet.length);

  return integerValue
    .split("")
    .reverse()
    .reduce((carry, digit, index) => {
      const fromIndex = fromAlphabet.indexOf(digit);
      if (fromIndex === -1) {
        invalidDigit(digit, fromAlphabet.length);
      }
      return carry + BigInt(fromIndex) * bigIntPow(fromBase, BigInt(index));
    }, BigInt(0));
}

/**
 * @param {bigint} base10Integer
 * @param {string[]} toAlphabet
 * @returns {string}
 */
function convertFromBase10Integer(base10Integer, toAlphabet) {
  const toBase = BigInt(toAlphabet.length);

  let value = "";
  while (base10Integer > 0) {
    value = toAlphabet[Number(base10Integer % toBase)] + value;
    base10Integer = (base10Integer - (base10Integer % toBase)) / toBase;
  }

  return value || "0";
}

/**
 * @param {string} value
 * @param {number} fromBase
 * @param {number} toBase
 */
export function convertBase(value, fromBase, toBase) {
  const range = defaultAlphabetRange;

  if (fromBase < 2 || fromBase > range.length) {
    invalidBase("fromBase", fromBase, range.length);
  }
  if (toBase < 2 || toBase > range.length) {
    invalidBase("toBase", toBase, range.length);
  }

  const fromRange = range.slice(0, fromBase);
  const toRange = range.slice(0, toBase);

  const base10Integer = convertToBase10Integer(value, fromRange);
  const toBaseInteger = convertFromBase10Integer(base10Integer, toRange);

  return toBaseInteger;
}
