import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Menu, X, Home, Award, LogOut, Gamepad2,
  LayoutDashboard, Library, GraduationCap, Mail, Phone, MapPin, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SearchBar from './SearchBar';
import AchievementsBadge from './AchievementsBadge';
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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ปิดเมนูเมื่อเปลี่ยนหน้า
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll เมื่อเปิดเมนู
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const navLinks = [
    { name: 'หน้าแรก', path: '/', icon: <Home size={18} /> },
    { name: 'คอร์สเรียน', path: '/courses', icon: <Award size={18} /> },
    { name: 'แหล่งเรียนรู้', path: '/resources', icon: <Library size={18} /> },
    { name: 'เกมฝึก', path: '/games', icon: <Gamepad2 size={18} /> },
  ];

  if (user) {
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
                <button className="btn-logout-full" onClick={() => { logout(); setIsMenuOpen(false); }}>
                  <LogOut size={16} /> ออกจากระบบ
                </button>
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

      <div className="footer-top-gradient"></div>
      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-section main-info">
            <div className="footer-logo">
              <span className="logo-icon">KJ</span>
              <strong>Kru James Portal</strong>
            </div>
            <p className="footer-desc">
              ยกระดับการเรียนรู้วิชาเทคโนโลยีและวิทยาการคำนวณ สำหรับชั้น ป.1 - ม.3 เรียนรู้อย่างสร้างสรรค์ ผ่านบอร์ดเกม เกมคอมพิวเตอร์ และนวัตกรรมใหม่ๆ 💡
            </p>
            <div className="footer-school-tag">
              🏫 โรงเรียนบ้านคลองมดแดง (สพป.พิษณุโลก เขต 1)
            </div>
          </div>
          
          <div className="footer-section">
            <h4>เมนูหลัก</h4>
            <Link to="/"><span className="bullet">⚡</span> หน้าแรก</Link>
            <Link to="/courses"><span className="bullet">📚</span> คอร์สเรียนทั้งหมด</Link>
            <Link to="/resources"><span className="bullet">🌐</span> แหล่งเรียนรู้</Link>
            <Link to="/games"><span className="bullet">🎮</span> คลังเกมฝึกทักษะ</Link>
          </div>
          
          <div className="footer-section">
            <h4>ช่วยเหลือ & ข้อมูล</h4>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsContactOpen(true); }}><span className="bullet">📞</span> ติดต่อครูเจมส์</a>
            <Link to="/resources#faq"><span className="bullet">❓</span> คำถามที่พบบ่อย</Link>
            <a href="https://g.co/kgs/DqPvxmZ" target="_blank" rel="noreferrer"><span className="bullet">📍</span> แผนที่โรงเรียน ↗</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }}><span className="bullet">🛡️</span> ความเป็นส่วนตัว</a>
          </div>
          
          <div className="footer-section">
            <h4>สำหรับคุณครู</h4>
            <Link to="/admin"><span className="bullet">⚙️</span> แผงควบคุมระบบ (Admin)</Link>
            <Link to="/admin#site"><span className="bullet">💾</span> สำรองและกู้คืนข้อมูล</Link>
            <Link to="/admin#gradebook"><span className="bullet">📊</span> จัดการคะแนน K/P/A</Link>
            <Link to="/admin#schedule"><span className="bullet">📅</span> ตารางเวรการสอน</Link>
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
      </footer>

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
