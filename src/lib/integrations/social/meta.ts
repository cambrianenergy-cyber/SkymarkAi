// Stub for storeMetaToken to unblock build
export async function storeMetaToken(...args: any[]): Promise<any> {
  return {
    access_token: "mock_access_token",
    expires_in: 3600,
    token_type: "Bearer"
  };
}
