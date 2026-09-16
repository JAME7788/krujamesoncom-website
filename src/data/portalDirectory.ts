import { gamesCatalog } from './gamesCatalog';
import { isAdminPortalUser, isScoreEligibleUser, type PortalUserIdentity } from '../services/userAccessService';

export type PortalSection = 'learn' | 'practice' | 'results' | 'teach';
export interface PortalEntry { title: string; detail: string; path: string; section: PortalSection; keywords?: string }
export const portalSections: Record<PortalSection, string> = {
  learn: 'บทเรียนและสื่อ', practice: 'เกมและกิจกรรม', results: 'งานและผลการเรียน', teach: 'พื้นที่ครู',
};

export function portalDirectory(user?: Partial<PortalUserIdentity> | null): PortalEntry[] {
  const entries: PortalEntry[] = [
    { title: 'คอร์สเรียน', detail: 'รายวิชาและบทเรียนประจำชั้น', path: '/courses', section: 'learn' },
    { title: 'หลักสูตรและหน่วยเรียน', detail: 'ตัวชี้วัด สไลด์ และกิจกรรมรายหน่วย', path: '/curriculum', section: 'learn' },
    { title: 'แหล่งเรียนรู้', detail: 'สื่อและเครื่องมือประกอบการเรียน', path: '/resources', section: 'learn' },
    { title: 'ห้องเรียน 3D', detail: 'พื้นที่เรียนรู้และกิจกรรมเสมือนจริง', path: '/world', section: 'practice' },
    { title: 'เข้าร่วมควิซสด', detail: 'เข้าร่วมกิจกรรมด้วยรหัสห้อง', path: '/live', section: 'practice' },
    ...gamesCatalog.map(game => ({ title: game.title, detail: `${game.level} · ${game.skill}`, keywords: game.desc, path: game.path, section: 'practice' as const })),
  ];
  if (isScoreEligibleUser(user)) entries.push(
    { title: 'การบ้านของฉัน', detail: 'งานที่ได้รับมอบหมายและการส่งงาน', path: '/homework', section: 'results' },
    { title: 'พัฒนาการของฉัน', detail: 'กิจกรรมและความก้าวหน้าการเรียน', path: '/dashboard', section: 'results' },
    { title: 'ผลการเรียนของฉัน', detail: 'รายงานคะแนนส่วนบุคคล', path: '/report-card', section: 'results' },
  );
  if (isAdminPortalUser(user)) entries.push(
    { title: 'คาบเรียนวันนี้', detail: 'เช็คชื่อ เปิดบทเรียน และบันทึกหลังสอน', path: '/admin?tab=today', section: 'teach' },
    { title: 'กำหนดการสอน', detail: 'วางลำดับแผนและวันสอน', path: '/admin?tab=teaching-schedule', section: 'teach' },
    { title: 'สมุดคะแนน K/P/A', detail: 'ตรวจและบันทึกผลรายบุคคล', path: '/admin?tab=gradebook', section: 'teach' },
    { title: 'แบบประเมินและหลังสอน', detail: 'บันทึกผลการจัดการเรียนรู้', path: '/admin?tab=assessments', section: 'teach' },
    { title: 'จัดการการบ้าน', detail: 'มอบหมายและติดตามงานนักเรียน', path: '/admin?tab=homework', section: 'teach' },
    { title: 'เอกสารวัดผล', detail: 'ส่งออก ปพ.5 และเอกสารคะแนน', path: '/admin?tab=export-grades', section: 'teach' },
    { title: 'วิจัย ๕ บท & ว.PA', detail: 'เล่มวิจัยในชั้นเรียน และข้อตกลงพัฒนางาน ว.PA', path: '/admin?tab=research', section: 'teach' },
    { title: 'เครื่องมือครู', detail: 'เครื่องมือสำหรับกิจกรรมในชั้นเรียน', path: '/tools', section: 'teach' },
  );
  return entries;
}

export function filterPortal(entries: PortalEntry[], query: string, section: PortalSection | 'all') {
  const terms = query.trim().toLocaleLowerCase('th').split(/\s+/).filter(Boolean);
  return entries.filter(entry => (section === 'all' || entry.section === section)
    && terms.every(term => `${entry.title} ${entry.detail} ${entry.keywords || ''}`.toLocaleLowerCase('th').includes(term)));
}

export function isPortalNavActive(pathname: string, target: string): boolean {
  if (target === '/courses') return ['/courses', '/curriculum', '/lesson', '/quiz'].some(root => pathname === root || pathname.startsWith(`${root}/`));
  return pathname === target || (target !== '/' && pathname.startsWith(`${target}/`));
}
