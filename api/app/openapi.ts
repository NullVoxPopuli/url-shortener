export function dynamicSegment(name: string) {
  return {
    in: 'path',
    name,
    schema: { type: 'string' },
    required: true,
  } as const;
}

export function jsonapiRef(selector: string) {
  return `https://raw.githubusercontent.com/json-api/json-api/refs/heads/gh-pages/_schemas/1.0/schema.json#/${selector}`;
}

export function ref(ref: string) {
  return { $ref: ref };
}

export function componentSchemaRef(schema: string) {
  return ref(`#/components/schemas/${schema}`);
}
