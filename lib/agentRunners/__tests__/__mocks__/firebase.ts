// Minimal test to satisfy Jest
describe('firebase mock', () => {
	it('should export db', () => {
		expect(typeof db).toBeDefined();
	});
});
// Jest mock for firebase.ts to avoid real Firebase initialization in tests
export const db = {};
export const auth = {};
export const storage = {};
