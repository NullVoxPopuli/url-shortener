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
