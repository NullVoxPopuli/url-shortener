import { describe, it, expect } from "vitest";

import { compressedUUID } from "./uuid.js";

let samples = `
320684ca-8c22-43fa-884b-db9d687fbe71
4afbd2e3-be8f-4cca-b0ba-7091cef33c63
6f0cee72-10c9-481e-b837-fd51d8eff1c5
83d18643-de23-4322-bc41-4c19e6bc940f
b7d20768-6cf3-4380-b377-cbf7b50cfbde
d1c797d7-4510-4b0a-bed4-04ef95e18366
f9903964-5dd5-4f98-b907-1c45ba313baa
00f318f0-e933-4507-9d3c-8220b1dba66c
29acc3b4-b05f-4d29-92f3-8e6ee686ab08
b45b275c-384a-43d2-8cd6-c1851341b52f
95caf73c-b2a9-4d32-97d5-dd4d97e781c7
d28aa6aa-dd76-4dc3-91ab-77701baf68ce
ea254067-df7b-43bc-8481-8f25dd07f03c
ce887967-a59f-4c18-9a9e-4ada3ff2bd35
33f98083-fa93-4720-84c8-16acf16abeb5
ea489bb2-53c2-4e6c-831e-f8196d13a797
dc45ff02-e5dd-48e6-ac74-ba4c8b252670
1a8342e7-e54d-4747-ab82-4f8dba2404a4
482bdf9a-fecc-48ca-a857-887c59647ad4
87c5ab51-d781-4442-839c-b93fa9580b20
1963082d-4a5a-433f-bbaa-2754f9df3907
5e85ffbe-e2c0-4fa8-8ee0-7c3616ead8da
c59d6b64-5c49-4757-a204-fb42322037bd
4094cc4b-4471-40e2-b29c-5c13bbf90b08
b7d5cee1-90fd-4026-8e13-38c684918442
b7b8401b-7cb8-4401-a2f3-f7cd599083de
a73a73f2-539d-4520-9a64-7a8b6ee34b54
53e8621d-b418-4bdb-b945-6c6bbe0c9984
5c9d89e0-5137-40db-bb76-90ed490f4b53
422d7461-ea48-44d6-bc27-cacc35310591
69110c08-8d60-4cec-80c6-189944419fd6
d9ce3bcd-e9eb-46a6-add6-6ac98830938d
3942d768-d4ac-44e8-9184-ffd429ef29e9
92bdda98-930a-4eb6-b7fe-e4760eced3c3
53f3070f-1f8a-489b-ae13-305f743365a1
3e195444-8766-4200-a23b-ff66200ace35
e083bf4d-d3f2-4fac-a561-3a3829d67cd0
cce557aa-534e-4473-924d-28b1229f020c
c077b7c1-69da-4dbd-976d-3579d24db02a
ea6f2a02-a898-4f00-9f3f-0e4421fa3257
1e37d739-aca0-41b1-b039-8e2e917e08d2
c7462a94-723c-4469-bae6-c4733a9117d2
63b38930-8d1a-4f78-ade5-87021bb424ef
4a2810f0-0910-4ad7-91b3-0318bcea29a0
cce435ce-86f7-42b3-b715-aaf872f2645f
ba213053-5249-4e17-bf3e-888aecec1b29
7e407f43-e10b-4964-9d4b-28938d39a630
0cf5f76f-f054-4a79-87c0-173f1687d785
82ad1efc-a4c5-4d23-b301-90056830cce6
2876a177-03da-42e6-a122-9423b9cbd66e
f2a03b29-27ca-4202-8a68-53b8584ae2d5
a02bcbde-cbf6-4dd5-8a6e-87b5b7cd96b7
854c80b3-0fd5-4221-bac1-2533fed104ca
5bd73295-928c-4984-b062-f26bfc179ab2
1ac4312d-d89d-43c7-98fc-789772ae400e
ed14add2-9fdc-49e4-b434-4ca65278df84
084f2d09-0bc4-4036-b6ac-fec009218b4c
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
