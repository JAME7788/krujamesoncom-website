import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, LayoutDashboard, Award, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'หน้าแรก', path: '/', icon: <BookOpen size={20} /> },
    { name: 'คอร์สเรียน', path: '/courses', icon: <Award size={20} /> },
    { name: 'แหล่งเรียนรู้', path: '/resources', icon: <BookOpen size={20} /> },
    { name: 'แดชบอร์ด', path: '/dashboard', icon: <LayoutDashboard size={20} /> },
  ];

  return (
    <div className="app-container">
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container nav-content">
          <Link to="/" className="logo">
            <span className="logo-icon">KJ</span>
            <span className="logo-text">Kru James<span>.com</span></span>
          </Link>

          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
            
            {user ? (
              <div className="user-profile-nav">
                <div className="user-avatar-placeholder">
                   {user.name.charAt(0)}
                </div>
                <div className="user-info-mini">
                  <span className="user-name">{user.name}</span>
                  <span className="user-class">{user.classroom}/{user.studentNumber}</span>
                  <button className="btn-logout" onClick={logout}><LogOut size={14} /> ออกจากระบบ</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="btn-login">เข้าสู่ระบบ</Link>
            )}
          </div>

          <div className="nav-actions">
             <button className="icon-btn"><Bell size={22} /></button>
             <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
               {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
             </button>
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="footer">
        <div className="container footer-content">
          <div className="footer-info">
            <h3>Kru James Learning Portal</h3>
            <p>ยกระดับการเรียนรู้วิชาเทคโนโลยีและวิทยาการคำนวณ สำหรับ ป.1 - ม.3</p>
          </div>
          <div className="footer-links">
            <a href="#">นโยบายความเป็นส่วนตัว</a>
            <a href="#">ติดต่อสอบถาม</a>
          </div>
          <p className="copyright">© 2026 Kru James Soncom. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
