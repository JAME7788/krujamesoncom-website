export type PortalAccountType = 'student' | 'external' | 'admin';

export interface PortalUserIdentity {
  id: string;
  name: string;
  classroom: string;
  studentNumber: string;
  accountType?: PortalAccountType;
}

export const ADMIN_USER_ID = 'admin_teacher_account';
export const EXTERNAL_USER_PREFIX = 'external_visitor_';

export const isNonScoringUserId = (studentId?: string | null): boolean => {
  const id = String(studentId || '').trim();
  return !id || id === ADMIN_USER_ID || id.startsWith(EXTERNAL_USER_PREFIX);
};

export const getPortalAccountType = (
  user?: Partial<PortalUserIdentity> | null,
): PortalAccountType => {
  if (user?.accountType) return user.accountType;
  if (user?.id === ADMIN_USER_ID) return 'admin';
  if (user?.id?.startsWith(EXTERNAL_USER_PREFIX)) return 'external';
  return 'student';
};

export const isScoreEligibleUser = (
  user?: Partial<PortalUserIdentity> | null,
): user is PortalUserIdentity => (
  Boolean(user?.id)
  && getPortalAccountType(user) === 'student'
  && !isNonScoringUserId(user?.id)
);

export const isExternalVisitor = (
  user?: Partial<PortalUserIdentity> | null,
): boolean => getPortalAccountType(user) === 'external';

export const isAdminPortalUser = (
  user?: Partial<PortalUserIdentity> | null,
): boolean => getPortalAccountType(user) === 'admin';
