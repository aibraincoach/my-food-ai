import schema from "./correct.schema.json";

// These indices refer to existing items, never SAM regions from a new photo.
// A first clarification can have no items; only null can then be returned.
export function correctionSchema(sourceCount: number) {
  if (!Number.isSafeInteger(sourceCount) || sourceCount < 0 || sourceCount > 100) {
    throw new Error("Invalid correction source count.");
  }
  return {
    ...schema,
    properties: {
      ...schema.properties,
      items: {
        ...schema.properties.items,
        items: {
          ...schema.properties.items.items,
          properties: {
            ...schema.properties.items.items.properties,
            region_index: {
              ...schema.properties.items.items.properties.region_index,
              enum: [null, ...Array.from({ length: sourceCount }, (_, index) => index)],
            },
          },
        },
      },
    },
  };
}
