// Jest mock for firebase.ts to avoid real Firebase initialization in tests
export const db = {
	collection: jest.fn(() => ({
		add: jest.fn(() => Promise.resolve({ id: 'mockDocId' })),
		doc: jest.fn(() => ({
			get: jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) })),
			set: jest.fn(() => Promise.resolve()),
			update: jest.fn(() => Promise.resolve()),
		})),
		get: jest.fn(() => Promise.resolve({ docs: [] })),
	})),
};
export const doc = jest.fn(() => ({
	id: 'mockDocId',
}));
export const getDoc = jest.fn(() => Promise.resolve({ exists: true, data: () => ({}) }));
export const updateDoc = jest.fn(() => Promise.resolve());
export const arrayUnion = jest.fn((...args) => args);
export const serverTimestamp = jest.fn(() => new Date());
export const auth = {};
export const storage = {};

// (Removed duplicate exports for doc, getDoc, updateDoc, arrayUnion, serverTimestamp)
