import { describe, it, expect } from "vitest";

import { compressedUUID } from "./utils/uuid.js";

let samples = `
320684ca-8c22-43fa-884b-db9d687fbe71
4afbd2e3-be8f-4cca-b0ba-7091cef33c63
6f0cee72-10c9-481e-b837-fd51d8eff1c5
83d18643-de23-4322-bc41-4c19e6bc940f
b7d20768-6cf3-4380-b377-cbf7b50cfbde
d1c797d7-4510-4b0a-bed4-04ef95e18366
f9903964-5dd5-4f98-b907-1c45ba313baa
`
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

describe("compressed UUID", () => {
  for (let sample of samples) {
    it(`shrinks ${sample}`, () => {
      let result = compressedUUID.encode(sample);

      expect(result.length).toBeLessThan(sample.length);
    });

    it(`to/from of ${sample} is symmetric`, () => {
      let uriComponent = compressedUUID.encode(sample);
      let result = compressedUUID.decode(uriComponent);

      expect(result).toBe(sample);
    });
  }
});
