import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Gamepad2, ClipboardList, GraduationCap, Search, X, Library, LayoutGrid } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isAdminPortalUser, isScoreEligibleUser } from '../services/userAccessService';
import { filterPortal, portalDirectory, portalSections, type PortalSection } from '../data/portalDirectory';
import AnnouncementBanner from '../components/AnnouncementBanner';
import './WorkspaceHome.css';

const sectionIcons = { learn: BookOpen, practice: Gamepad2, results: ClipboardList, teach: GraduationCap };

export default function WorkspaceHome() {
  const { user } = useAuth();
  return <Workspace key={user?.id || 'visitor'} />;
}

function Workspace() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [section, setSection] = useState<PortalSection | 'all'>('all');
  const teacher = isAdminPortalUser(user);
  const student = isScoreEligibleUser(user);
  const entries = portalDirectory(user);
  const results = filterPortal(entries, query, section);
  const sections = (Object.keys(portalSections) as PortalSection[]).filter(key => entries.some(entry => entry.section === key));
  const shortcuts = teacher
    ? entries.filter(entry => entry.section === 'teach').slice(0, 4)
    : [entries[0], ...entries.filter(entry => entry.section === 'results'), entries[2]].slice(0, 4);

  return <div className="workspace-home">
    <header className="workspace-heading">
      <img className="workspace-cover" src="/media/lessons/curriculum-electronics.webp" alt="ภาพประกอบครูและนักเรียนทดลองเทคโนโลยีร่วมกัน" fetchPriority="high" />
      <div className="workspace-welcome"><span className="workspace-eyebrow">KRU JAMES LEARNING SPACE</span>
        <h1>ห้องเรียนครูเจมส์</h1>
        <div className="workspace-intro">เรียนรู้ผ่านการลงมือทำ<br />เติบโตไปกับโลกเทคโนโลยี</div>
        <p>{user ? `สวัสดี ${user.name}` : 'วิทยาการคำนวณและเทคโนโลยี'}<span className="workspace-role">{teacher ? 'พื้นที่ครู' : student ? `ชั้น ${user.classroom}` : 'พื้นที่ทดลองเรียน'}</span></p>
      <div className="workspace-hero-actions">
      <Link className="workspace-primary" to={teacher ? '/admin?tab=today' : user ? '/courses' : '/login'}>{teacher ? 'เปิดคาบเรียน' : user ? 'เข้าสู่บทเรียน' : 'เข้าสู่ระบบ'}<ArrowRight size={18} /></Link>
      <Link className="workspace-play" to="/games"><Gamepad2 size={20} />สำรวจเกม</Link>
      </div></div>
    </header>
    <section className="workspace-philosophy" aria-labelledby="learning-philosophy">
      <span className="workspace-eyebrow">LEARN · EXPLORE · CREATE</span>
      <h2 id="learning-philosophy">ทุกความสงสัย คือจุดเริ่มต้นของการเรียนรู้</h2>
      <p>พื้นที่สำหรับนักเรียนที่จะได้คิด ทดลอง และสร้างสรรค์ ผ่านบทเรียนวิทยาการคำนวณ เกมการเรียนรู้ และกิจกรรมเทคโนโลยี ค่อย ๆ พัฒนาทักษะจากสิ่งที่เข้าใจ ไปสู่สิ่งใหม่ที่ทำได้ด้วยตัวเอง</p>
    </section>
    <section className="workspace-shortcuts" aria-label="ทางลัด">
      {shortcuts.map(entry => { const Icon = sectionIcons[entry.section]; return <Link key={entry.path} to={entry.path}><Icon size={22} /><div><strong>{entry.title}</strong><span>{entry.detail}</span></div><ArrowRight size={17} /></Link>; })}
    </section>
    <section className="workspace-explore" aria-labelledby="workspace-explore-title">
      <div className="workspace-section-heading"><div><span className="workspace-eyebrow">LEARNING EXPERIENCES</span><h2 id="workspace-explore-title">ค้นพบความถนัด ผ่านการลงมือทำ</h2></div><Link to="/games">สำรวจกิจกรรมทั้งหมด <ArrowRight size={16} /></Link></div>
      <div className="workspace-features">
        <Link to="/games/digital-city-quest" className="workspace-feature"><img src="/media/games/tycoon-tech-city.webp" alt="แผนที่เมืองดิจิทัล" loading="lazy" /><div><span>01 / วางแผนและตัดสินใจ</span><h3>Digital City Quest</h3><p>ภารกิจกู้มหานครอัจฉริยะ</p><ArrowRight size={22} /></div></Link>
        <Link to="/games/coding-studio" className="workspace-feature"><img src="/media/lessons/curriculum-coding.webp" alt="ภาพประกอบบทเรียนการเขียนโปรแกรม" loading="lazy" /><div><span>02 / คิดเป็นขั้นตอน</span><h3>สตูดิโอเขียนโปรแกรม</h3><p>บล็อกคำสั่งและภาษา Python</p><ArrowRight size={22} /></div></Link>
        <Link to="/games/circuit-lab" className="workspace-feature"><img src="/media/lessons/curriculum-electronics.webp" alt="ภาพประกอบการทดลองอิเล็กทรอนิกส์" loading="lazy" /><div><span>03 / ทดลองและค้นพบ</span><h3>ห้องทดลองวงจร</h3><p>เชื่อมสายไฟ เปิดสวิตช์ จุดประกายความคิด</p><ArrowRight size={22} /></div></Link>
      </div>
    </section>
    <details className="workspace-announcements"><summary>ข่าวสารและประกาศจากครู</summary><AnnouncementBanner /></details>
    <section className="workspace-directory" aria-labelledby="workspace-directory-title">
      <div className="workspace-section-heading"><div><span className="workspace-eyebrow">เลือกเส้นทางของตัวเอง</span><h2 id="workspace-directory-title">ทุกพื้นที่การเรียนรู้</h2></div><Link to="/about">เกี่ยวกับห้องเรียน <ArrowRight size={16} /></Link></div>
      <div className="workspace-search"><Search size={21} /><input aria-label="ค้นหาพื้นที่การเรียนรู้" type="search" placeholder="ค้นหาบทเรียน เกม ทักษะ หรือเครื่องมือ..." value={query} onChange={event => setQuery(event.target.value)} />{query && <button type="button" aria-label="ล้างคำค้น" title="ล้างคำค้น" onClick={() => setQuery('')}><X size={18} /></button>}</div>
      <div className="workspace-filters" role="group" aria-label="หมวดพื้นที่การเรียนรู้">
        <button type="button" aria-pressed={section === 'all'} onClick={() => setSection('all')}><LayoutGrid size={17} />ทั้งหมด <small>{entries.length}</small></button>
        {sections.map(key => { const Icon = sectionIcons[key]; return <button type="button" key={key} aria-pressed={section === key} onClick={() => setSection(key)}><Icon size={17} />{portalSections[key]} <small>{entries.filter(entry => entry.section === key).length}</small></button>; })}
      </div>
      <p className="workspace-count" role="status">{results.length} รายการ{query && ` สำหรับ “${query}”`}</p>
      {results.length === 0 ? <div className="workspace-empty"><Library size={32} /><h3>ไม่พบรายการที่ค้นหา</h3><button type="button" onClick={() => { setQuery(''); setSection('all'); }}>แสดงทั้งหมด</button></div> :
        <div className="workspace-groups">{sections.map(key => { const group = results.filter(entry => entry.section === key); if (!group.length) return null; const Icon = sectionIcons[key]; return <section key={key} className={`workspace-group workspace-group-${key}`}><h3><Icon size={19} />{portalSections[key]} <small>{group.length}</small></h3><div className="workspace-entries">{group.map(entry => <Link key={entry.path} to={entry.path}><div><strong>{entry.title}</strong><span>{entry.detail}</span></div><ArrowRight size={17} /></Link>)}</div></section>; })}</div>}
    </section>
  </div>;
}
