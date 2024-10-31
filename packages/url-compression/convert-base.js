/**
 * GPL-3.0,
 *    - TS -> JS
 *    - Simpler (for specific custom base64~ish use case)
 *    - Removed fraction support
 *    - Changed default alphabet
 *    - No Negative number support
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
  return btoa(
    // @ts-ignore
    input
      .match(/\w{2}/g)
      .map(function (a) {
        return String.fromCharCode(parseInt(a, 16));
      })
      .join(""),
  )
    .replaceAll("+", "_")
    .replaceAll("/", ".");
}

/**
 * @param {string} base64String
 */
export function base64To16(base64String) {
  // Decode base64 to byte array
  const binaryString = atob(
    base64String.replaceAll(".", "/").replaceAll("_", "+"),
  );
  const hexString = Array.from(binaryString)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("");
  return hexString;
}
