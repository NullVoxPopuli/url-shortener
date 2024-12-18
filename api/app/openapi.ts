export function dynamicSegment(name: string) {
  return {
    in: 'path',
    name,
    schema: { type: 'string' },
    required: true,
  } as const;
}
