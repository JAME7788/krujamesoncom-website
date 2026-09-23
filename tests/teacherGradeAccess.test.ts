import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ user: null as null | { getIdTokenResult: () => Promise<{ claims: Record<string, unknown> }> }, profile: {} as Record<string, unknown> }));
vi.mock('firebase/auth', () => ({ getAuth: () => ({ authStateReady: async () => {}, currentUser: state.user && { ...state.user, uid: 'teacher' } }) }));
vi.mock('firebase/firestore', () => ({ doc: vi.fn(), getDoc: async () => ({ data: () => state.profile }) }));
vi.mock('../src/services/firebase', () => ({ default: {}, db: {} }));
import { requireTeacherGradeAccess } from '../src/services/teacherGradeAccess';
beforeEach(() => { state.user = null; state.profile = {}; });
describe('teacher grade access preflight', () => {
  it('requires Firebase identity, regardless of local admin sessions', async () => {
    await expect(requireTeacherGradeAccess()).rejects.toThrow('Firebase');
  });
  it.each(['teacher', 'admin'])('accepts verified %s claims', async role => {
    state.user = { getIdTokenResult: async () => ({ claims: { role } }) };
    await expect(requireTeacherGradeAccess()).resolves.toBeUndefined();
  });
  it('accepts an active teacher profile without custom claims', async () => {
    state.user = { getIdTokenResult: async () => ({ claims: {} }) };
    state.profile = { role: 'teacher', active: true };
    await expect(requireTeacherGradeAccess()).resolves.toBeUndefined();
  });
  it.each([{ role: 'viewer', active: true }, { role: 'teacher', active: false }])('rejects insufficient profile %j', async profile => {
    state.user = { getIdTokenResult: async () => ({ claims: {} }) }; state.profile = profile;
    await expect(requireTeacherGradeAccess()).rejects.toThrow('ไม่มีสิทธิ์');
  });
});
