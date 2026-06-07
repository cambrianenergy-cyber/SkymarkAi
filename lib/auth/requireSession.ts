// Stub for requireSession to unblock build
export async function requireSession(...args: any[]): Promise<any> {
	return { user: { id: "mock_user_id" } };
}
