import { describe, expect, it } from 'vitest';
import {
  ADMIN_USER_ID,
  EXTERNAL_USER_PREFIX,
  getPortalAccountType,
  isAdminPortalUser,
  isExternalVisitor,
  isNonScoringUserId,
  isScoreEligibleUser,
} from '../src/services/userAccessService';

describe('portal account separation', () => {
  it('never treats the admin account as a scoring student', () => {
    const admin = {
      id: ADMIN_USER_ID,
      name: 'ครูผู้ดูแล',
      classroom: 'ป.1',
      studentNumber: '00',
      accountType: 'admin' as const,
    };

    expect(isAdminPortalUser(admin)).toBe(true);
    expect(isNonScoringUserId(admin.id)).toBe(true);
    expect(isScoreEligibleUser(admin)).toBe(false);
  });

  it('keeps external visitors outside attendance and K/P/A', () => {
    const external = {
      id: `${EXTERNAL_USER_PREFIX}session123`,
      name: 'ผู้ทดลอง',
      classroom: 'ผู้ทดลองภายนอก',
      studentNumber: '-',
      accountType: 'external' as const,
    };

    expect(isExternalVisitor(external)).toBe(true);
    expect(isNonScoringUserId(external.id)).toBe(true);
    expect(isScoreEligibleUser(external)).toBe(false);
  });

  it('allows only a regular school student identity to receive scores', () => {
    const student = {
      id: 'ป.1_1_นักเรียนทดสอบ',
      name: 'นักเรียนทดสอบ',
      classroom: 'ป.1',
      studentNumber: '1',
      accountType: 'student' as const,
    };

    expect(isNonScoringUserId(student.id)).toBe(false);
    expect(isScoreEligibleUser(student)).toBe(true);
  });

  it('infers legacy sessions without weakening reserved-id protection', () => {
    expect(getPortalAccountType({ id: 'ป.2_3_ทดสอบ' })).toBe('student');
    expect(getPortalAccountType({ id: ADMIN_USER_ID })).toBe('admin');
    expect(getPortalAccountType({ id: `${EXTERNAL_USER_PREFIX}abc` })).toBe('external');
  });
});
