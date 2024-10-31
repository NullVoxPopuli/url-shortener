/**
 * GPL-3.0,
 *    - TS -> JS
 *    - Simpler (for specific custom base64~ish use case)
 *    - Removed fraction support
 *    - Changed default alphabet
 *    - No Negative number support
 *
 * Base64 replacements:
 *  + => _ because + means space
 *  / => . because / means subpath
 *  = => - because = means key = value
 *
 */
// const letters = "abcdefghijklmnopqrstuvwxyz"; // * 2 = 52
// const digits = "0123456789"; // 52 + 10 = 62
// const special = `_.`;
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

/**
 * @param {string} input
 */
export function base16To64(input) {
  return (
    btoa(
      // @ts-ignore
      input
        .match(/\w{2}/g)
        .map(function (a) {
          return String.fromCharCode(parseInt(a, 16));
        })
        .join(""),
    )
      .replaceAll("+", "_")
      .replaceAll("/", ".")
      // Seems safe...
      // in Base64, the = indicates that the
      // input is not a multiple of 3 bytes
      //
      // See: https://medium.com/@partha.pratimnayak/understanding-base64-encoding-7764b4ecce3c
      //   - two equal signs, just to indicate that it had to add two characters of padding.
      //   - If we have five bytes, we have one equal sign,
      //   - and if we have six bytes, then there are no equal signs,
      //     indicating that the input fits neatly into base64 with no need for padding.
      //     The padding is null.
      //
      // Our base16 strings are always going to be 32 characters
      // which should be 32 bytes. which is one byte shy of % 3 === 0
      .replaceAll(/==$/g, "")
  );
}

const padding = {
  1: "==",
  2: "=",
  0: "",
};

/**
 * @param {string} base64String
 */
export function base64To16(base64String) {
  let neededPadding = base64String.length % 3;
  // @ts-ignore
  let chars = padding[neededPadding];
  let raw64 =
    base64String
      .replaceAll(".", "/")
      .replaceAll("_", "+")
      .replaceAll("-", "=") + chars;

  // Decode base64 to byte array
  const binaryString = atob(raw64);
  const hexString = Array.from(binaryString)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return hexString;
}
