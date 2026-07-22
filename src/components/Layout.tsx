import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X, Home, Award, LogOut, Gamepad2,
  LayoutDashboard, Library, GraduationCap, Mail, Phone, MapPin, Globe, Box
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import AchievementsBadge from './AchievementsBadge';
import DarkModeToggle from './DarkModeToggle';
import AITutor from './AITutor';
import { fetchScheduleFromFirebase } from '../data/schedule';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, partner, logout } = useAuth();
  const location = useLocation();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isCookieOpen, setIsCookieOpen] = useState(false);
  const isImmersive = location.pathname.startsWith('/world');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ดึงตารางสอนจาก Firebase ครั้งแรกที่เปิดแอป + ซิงค์ทุก 5 นาที (ทุกหน้าได้ของล่าสุด)
  useEffect(() => {
    void fetchScheduleFromFirebase();
    const t = setInterval(() => { void fetchScheduleFromFirebase(); }, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setIsMenuOpen(false);
  }


  // Lock body scroll เมื่อเปิดเมนู
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const navLinks: { name: string; path: string; icon: React.ReactNode }[] = [
    { name: 'หน้าแรก', path: '/', icon: <Home size={18} /> },
    { name: 'คอร์สเรียน', path: '/courses', icon: <Award size={18} /> },
    { name: 'แหล่งเรียนรู้', path: '/resources', icon: <Library size={18} /> },
    { name: 'เกมฝึก', path: '/games', icon: <Gamepad2 size={18} /> },
    { name: 'ห้องเรียน 3D', path: '/world', icon: <Box size={18} /> },
  ];

  if (user) {
    navLinks.push({ name: 'การบ้าน', path: '/homework', icon: <Award size={18} /> });
    navLinks.push({ name: 'แดชบอร์ด', path: '/dashboard', icon: <LayoutDashboard size={18} /> });
  }

  return (
    <div className="app-container">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-content">
          {/* Logo */}
          <Link to="/" className="logo">
            <span className="logo-icon">KJ</span>
            <span className="logo-text">Kru James<span>.com</span></span>
          </Link>

          {/* Desktop nav links */}
          <div className="nav-links-desktop">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          {/* Right actions */}
          <div className="nav-actions">
            <SearchBar />
            <DarkModeToggle />
            {user && <AchievementsBadge />}
            <button 
              className="icon-btn" 
              onClick={() => setIsContactOpen(true)} 
              title="ติดต่อสอบถาม"
            >
              <Mail size={18} />
            </button>

            {user ? (
              <div className="user-chip">
                <div className="user-chip-avatar">{user.name.charAt(0)}</div>
                <div className="user-chip-info">
                  <span className="user-chip-name">
                    {user.name.split(' ')[0]}
                    {partner && <span className="partner-tag">👯</span>}
                  </span>
                  <span className="user-chip-class">{user.classroom}/{user.studentNumber}</span>
                </div>
                {user.id !== 'admin_teacher_account' && (
                  <Link className="user-chip-switch" to="/login" title="เปลี่ยนนักเรียน">
                    เปลี่ยน
                  </Link>
                )}
                <button className="user-chip-logout" onClick={logout} title="ออกจากระบบ">
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="btn-login-nav">
                <GraduationCap size={16} /> เข้าสู่ระบบ
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      {isMenuOpen && (
        <>
          <div className="mobile-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
          <aside className="mobile-menu">
            <div className="mobile-menu-header">
              <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
                <span className="logo-icon">KJ</span>
                <span className="logo-text">Kru James<span>.com</span></span>
              </Link>
              <button onClick={() => setIsMenuOpen(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="mobile-user-card">
                <div className="user-chip-avatar large">{user.name.charAt(0)}</div>
                <div>
                  <div className="user-chip-name large">
                    {user.name}
                    {partner && <span className="partner-tag">👯 {partner.name.split(' ').slice(-1)[0]}</span>}
                  </div>
                  <div className="user-chip-class">ชั้น {user.classroom} • เลขที่ {user.studentNumber}</div>
                </div>
              </div>
            )}

            <nav className="mobile-nav-links">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`mobile-nav-item ${location.pathname === link.path ? 'active' : ''}`}
                >
                  {link.icon}
                  <span>{link.name}</span>
                </Link>
              ))}
            </nav>

            <div className="mobile-menu-footer">
              {user ? (
                <>
                  {user.id !== 'admin_teacher_account' && (
                    <Link className="btn-login-full" to="/login" onClick={() => setIsMenuOpen(false)}>
                      <GraduationCap size={16} /> เปลี่ยนนักเรียน
                    </Link>
                  )}
                  <button className="btn-logout-full" onClick={() => { logout(); setIsMenuOpen(false); }}>
                    <LogOut size={16} /> ออกจากระบบ
                  </button>
                </>
              ) : (
                <Link to="/login" className="btn-login-full">
                  <GraduationCap size={16} /> เข้าสู่ระบบ
                </Link>
              )}
            </div>
          </aside>
        </>
      )}

      <main>{children}</main>

      {/* Floating AI Tutor (เฉพาะ login แล้ว) */}
      {user && !isImmersive && <AITutor />}

      {!isImmersive && <div className="footer-top-gradient"></div>}
      {!isImmersive && <footer className="footer">
        <div className="container footer-content">
          <div className="footer-brand-section">
            <div className="footer-logo">
              <span className="logo-icon">KJ</span>
              <strong>Kru James Portal</strong>
            </div>
            <p className="footer-desc">
              ระบบสารสนเทศเพื่อสนับสนุนการจัดการเรียนรู้รายวิชาเทคโนโลยีและวิทยาการคำนวณ โรงเรียนบ้านคลองมดแดง
            </p>
            <div className="footer-school-tag">
              🏫 โรงเรียนบ้านคลองมดแดง (สพป.กำแพงเพชร เขต 2)
            </div>
          </div>
          
          <div className="footer-policy-card">
            <div className="policy-card-icon">🛡️</div>
            <div className="policy-card-info">
              <h4>การคุ้มครองข้อมูลส่วนบุคคล (PDPA)</h4>
              <p>ระบบบันทึกเวลาเรียน คะแนนสะสม และแบบทดสอบของนักเรียน ได้รับการดูแลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล เพื่อการประเมินผลสัมฤทธิ์ทางการเรียนเฉพาะบุคคล โดยไม่มีการเผยแพร่ภายนอก</p>
              <div className="policy-card-links">
                <a href="#" onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }}>ความเป็นส่วนตัว ↗</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setIsCookieOpen(true); }}>การใช้งานคุกกี้ 🍪</a>
              </div>
            </div>
          </div>
          
          <div className="footer-policy-card">
            <div className="policy-card-icon">⚖️</div>
            <div className="policy-card-info">
              <h4>ความโปร่งใสทางลิขสิทธิ์ (Copyright)</h4>
              <p>เนื้อหาบทเรียน สไลด์สื่อการสอน และวิดีโอประกอบการเรียนรู้ในเว็บไซต์นี้ ได้รับการเผยแพร่ภายใต้หลักการใช้งานที่ชอบธรรม (Fair Use) เพื่อประโยชน์การศึกษาภายในโรงเรียนเท่านั้น</p>
              <div className="policy-card-links">
                <span className="non-commercial-badge">🤝 กิจกรรมเพื่อการศึกษา (Non-Commercial)</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="container footer-bottom-inner">
            <p className="footer-copyright">
              © 2026 ห้องเรียนครูเจมส์. สงวนลิขสิทธิ์ทั้งหมด. จัดทำเพื่อประโยชน์ทางการเรียนการสอน
            </p>
            <div className="footer-policy-links">
              <a href="#" onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }}>
                นโยบายความเป็นส่วนตัว (Privacy Policy)
              </a>
              <span className="divider"></span>
              <a href="#" onClick={(e) => { e.preventDefault(); setIsCookieOpen(true); }}>
                นโยบายคุกกี้ (Cookie Policy)
              </a>
            </div>
          </div>
        </div>
      </footer>}

      {isContactOpen && (
        <div className="contact-overlay" onClick={() => setIsContactOpen(false)}>
          <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-header">
              <h2>📞 ช่องทางการติดต่อสอบถาม</h2>
              <button className="contact-close-btn" onClick={() => setIsContactOpen(false)} aria-label="ปิด">
                <X size={20} />
              </button>
            </div>
            <div className="contact-body">
              <div className="contact-profile">
                <div className="contact-avatar">KJ</div>
                <div>
                  <h3>คุณครูเจมส์ (Kru James)</h3>
                  <p className="contact-role">ครูผู้สอนวิชาคอมพิวเตอร์และเทคโนโลยี</p>
                  <p className="contact-school">โรงเรียนบ้านคลองมดแดง</p>
                </div>
              </div>
              
              <div className="contact-info-list">
                <div className="contact-info-item">
                  <div className="contact-info-icon"><Mail size={18} /></div>
                  <div className="contact-info-text">
                    <span className="contact-label">อีเมลติดต่อ</span>
                    <a href="mailto:krujames.soncom@gmail.com">krujames.soncom@gmail.com</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><Phone size={18} /></div>
                  <div className="contact-info-text">
                    <span className="contact-label">เบอร์โทรศัพท์โรงเรียน</span>
                    <a href="tel:055701000">055-701-XXX (ต่อกลุ่มสาระฯ)</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><Globe size={18} /></div>
                  <div className="contact-info-text">
                    <span className="contact-label">หน้าเพจ/โซเชียลมีเดีย</span>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">ครูเจมส์ สอนคอม (Facebook Page)</a>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon"><MapPin size={18} /></div>
                  <div className="contact-info-text">
                    <span className="contact-label">ที่ตั้งโรงเรียน</span>
                    <span>โรงเรียนบ้านคลองมดแดง ต.คลองมดแดง อ.เมือง จ.กำแพงเพชร</span>
                  </div>
                </div>
              </div>

              <div className="contact-notice">
                💡 <strong>หมายเหตุ:</strong> นักเรียนที่ติดปัญหาระบบเช็คชื่อ คะแนน หรือการล็อกอินเข้าเรียน สามารถทักสอบถามคุณครูผ่านช่องทาง Line ID: <strong>@krujames</strong> หรือแจ้งในชั่วโมงเรียนคอมพิวเตอร์ได้โดยตรงครับ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {isPrivacyOpen && (
        <div className="contact-overlay" onClick={() => setIsPrivacyOpen(false)}>
          <div className="contact-modal policy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-header">
              <h2 className="policy-title">🛡️ นโยบายความเป็นส่วนตัว (Privacy Policy)</h2>
              <button className="contact-close-btn" onClick={() => setIsPrivacyOpen(false)} aria-label="ปิด">
                <X size={20} />
              </button>
            </div>
            <div className="contact-body policy-body">
              <div className="policy-section">
                <h3>1. วัตถุประสงค์</h3>
                <p>เว็บไซต์ห้องเรียนครูเจมส์ (krujames.com) จัดทำขึ้นเพื่อใช้ในการเรียนการสอนวิชาคอมพิวเตอร์และเทคโนโลยี โรงเรียนบ้านคลองมดแดง เพื่อช่วยบันทึกการเช็คชื่อ ส่งการบ้าน และวัดประเมินผลการเรียนรู้ของนักเรียน</p>
              </div>
              <div className="policy-section">
                <h3>2. การจัดเก็บข้อมูล</h3>
                <p>ระบบจะจัดเก็บข้อมูลพื้นฐานเฉพาะที่จำเป็น ได้แก่ ชื่อ-นามสกุล ชั้นเรียน เลขที่ บันทึกการเข้าเรียน คะแนนสอบ และคะแนนทักษะ K/P/A เพื่อประมวลผลเป็นสมุดรายงานผลการเรียนส่วนบุคคล</p>
              </div>
              <div className="policy-section">
                <h3>3. ความปลอดภัยและการเผยแพร่</h3>
                <p>ข้อมูลการเรียนทั้งหมดจะถูกจัดเก็บเป็นความลับและเข้าถึงได้โดยคุณครูผู้สอนเพื่อวัตถุประสงค์ในการประเมินผลการเรียนรู้ของนักเรียนเท่านั้น จะไม่มีการเปิดเผยข้อมูลส่วนบุคคลหรือคะแนนของนักเรียนแก่บุคคลภายนอกหรือนำไปใช้ในเชิงพาณิชย์โดยเด็ดขาด</p>
              </div>
              <div className="policy-section">
                <h3>4. สิทธิ์ของนักเรียนและผู้ปกครอง</h3>
                <p>นักเรียนและผู้ปกครองมีสิทธิ์ในการขอดูลบ หรือแก้ไขข้อมูลส่วนบุคคลให้ถูกต้องได้ทุกเมื่อ โดยสามารถแจ้งความประสงค์ผ่านคุณครูผู้สอนประจำวิชาได้โดยตรง</p>
              </div>
              <button className="btn-policy-close" onClick={() => setIsPrivacyOpen(false)}>
                รับทราบและยอมรับนโยบาย
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Policy Modal */}
      {isCookieOpen && (
        <div className="contact-overlay" onClick={() => setIsCookieOpen(false)}>
          <div className="contact-modal policy-modal" onClick={(e) => e.stopPropagation()}>
            <div className="contact-header">
              <h2 className="policy-title">🍪 นโยบายคุกกี้ (Cookie Policy)</h2>
              <button className="contact-close-btn" onClick={() => setIsCookieOpen(false)} aria-label="ปิด">
                <X size={20} />
              </button>
            </div>
            <div className="contact-body policy-body">
              <div className="policy-section">
                <h3>1. คุกกี้ (Cookies) คืออะไร?</h3>
                <p>คุกกี้คือข้อมูลขนาดเล็กที่ถูกบันทึกไว้ในเบราว์เซอร์ของอุปกรณ์ท่านเมื่อเข้าใช้งานเว็บไซต์ เพื่อช่วยจดจำข้อมูลการตั้งค่าและประวัติการทำงานของคุณ</p>
              </div>
              <div className="policy-section">
                <h3>2. คุกกี้ที่ใช้บนเว็บไซต์นี้</h3>
                <p>เราใช้คุกกี้ประเภท <strong>"คุกกี้ที่มีความจำเป็นอย่างยิ่ง" (Essential Cookies)</strong> ซึ่งมีความสำคัญต่อการทำงานของระบบในการจดจำบัญชีเข้าใช้งานของนักเรียนเพื่อหลีกเลี่ยงการต้องเข้าสู่ระบบซ้ำทุกครั้ง และบันทึกคะแนนกิจกรรมการเรียนรู้แบบออฟไลน์/ออนไลน์</p>
              </div>
              <div className="policy-section">
                <h3>3. การจัดการคุกกี้</h3>
                <p>นักเรียนสามารถเลือกปิดหรือล้างคุกกี้ผ่านเมนูตั้งค่าความเป็นส่วนตัวในเบราว์เซอร์ของท่านได้ตลอดเวลา อย่างไรก็ดี หากท่านเลือกปฏิเสธการใช้งานคุกกี้ ฟังก์ชันการจำข้อมูลล็อกอินและคะแนนสะสมชั่วคราวบางส่วนอาจทำงานได้ไม่สมบูรณ์</p>
              </div>
              <button className="btn-policy-close" onClick={() => setIsCookieOpen(false)}>
                รับทราบและยอมรับนโยบาย
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
