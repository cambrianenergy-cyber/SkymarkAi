export type QueryShape = {
  collection: string;
  where: string[];
  orderBy: string[];
  limit?: number;
};

export function logQueryShape(shape: QueryShape) {
  // Only log field names and operators, never sensitive values
  console.info("FIRESTORE_QUERY_SHAPE", shape);
  // Optionally send to Sentry, Cloud Logging, or audit_logs
}

// Example usage:
// logQueryShape({
//   collection: "leads",
//   where: ["workspaceId==", "status=="],
//   orderBy: ["createdAt desc"],
//   limit: 50
// });
