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

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">KJ</span>
              <strong>Kru James Learning Portal</strong>
            </div>
            <p>ยกระดับการเรียนรู้วิชาเทคโนโลยีและวิทยาการคำนวณ สำหรับ ป.1 - ม.3</p>
          </div>
          <div className="footer-section">
            <h4>เมนู</h4>
            <Link to="/">หน้าแรก</Link>
            <Link to="/courses">คอร์สเรียน</Link>
            <Link to="/resources">แหล่งเรียนรู้</Link>
            <Link to="/games">เกมฝึก</Link>
          </div>
          <div className="footer-section">
            <h4>ช่วยเหลือ</h4>
            <a href="#">นโยบายความเป็นส่วนตัว</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsContactOpen(true); }}>ติดต่อสอบถาม</a>
            <Link to="/admin">สำหรับครู (Admin)</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 Kru James Soncom • โรงเรียนบ้านคลองมดแดง • Built with ❤️ for Thai students</p>
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
    </div>
  );
};

export default Layout;
