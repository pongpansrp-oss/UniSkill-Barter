import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Header.module.css';
import { Bell, User, GraduationCap, ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
}

const Header: React.FC<HeaderProps> = ({ title = 'Explore', showBack = false, backTo }) => {
  const navigate = useNavigate();
  const { currentUser, isGuest, db, logout } = useDatabase();
  const [showNotif, setShowNotif] = useState(false);

  const myNotifications = db.requests.filter(
    (r) =>
      currentUser &&
      (r.targetUserId === currentUser.id || r.requesterId === currentUser.id) &&
      (r.status === 'Pending' || r.status === 'Accepted' || r.status === 'Completed')
  );

  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else {
      navigate(-1);
    }
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logoArea}>
          {showBack && (
            <button
              type="button"
              className={styles.backButton}
              onClick={handleBack}
              aria-label="ย้อนกลับ"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div className={styles.logoBox} onClick={() => navigate('/explore')}>
            <GraduationCap size={16} color="var(--primary)" />
            <span className={styles.logoMiniText}>USE</span>
          </div>
          <div className={styles.brandText} onClick={() => navigate('/explore')}>
            <span className={styles.brandTag}>USE</span>
            <span className={styles.pageTitle}>{title}</span>
          </div>
        </div>

        <div className={styles.actions}>
          {currentUser?.role === 'admin' && (
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => navigate('/admin')}
              title="หน้าจัดการระบบ Admin"
            >
              <ShieldAlert size={18} color="var(--primary)" />
            </button>
          )}

          <div className={styles.notifWrapper}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setShowNotif((prev) => !prev)}
              aria-label="การแจ้งเตือน"
            >
              <Bell size={18} />
              {myNotifications.length > 0 && <span className={styles.badge}></span>}
            </button>

            {showNotif && (
              <div className={styles.notifDropdown}>
                <div className={styles.notifHeader}>
                  <span>การแจ้งเตือนคำขอแลกเปลี่ยน</span>
                  <button
                    type="button"
                    className={styles.notifLink}
                    onClick={() => {
                      setShowNotif(false);
                      navigate('/create-request');
                    }}
                  >
                    ดูทั้งหมด
                  </button>
                </div>
                {isGuest ? (
                  <p className={styles.notifEmpty}>เข้าสู่ระบบนักศึกษาเพื่อรับการแจ้งเตือนคำขอ</p>
                ) : myNotifications.length === 0 ? (
                  <p className={styles.notifEmpty}>ยังไม่มีรายการแจ้งเตือนใหม่</p>
                ) : (
                  <div className={styles.notifList}>
                    {myNotifications.slice(0, 4).map((req) => {
                      const isIncoming = currentUser && req.targetUserId === currentUser.id;
                      return (
                        <div
                          key={req.id}
                          className={styles.notifItem}
                          onClick={() => {
                            setShowNotif(false);
                            navigate('/create-request');
                          }}
                        >
                          <div className={styles.notifTitle}>
                            {isIncoming ? '📥 ' : '📤 '}
                            {req.title}
                          </div>
                          <div className={styles.notifMeta}>
                            {isIncoming
                              ? `จาก: ${req.requesterName}`
                              : `ถึง: ${req.targetUserName || 'บอร์ดสาธารณะ'}`}{' '}
                            • สถานะ: <strong>{req.status}</strong>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.userCircle}
            onClick={() => navigate(isGuest ? '/' : '/profile')}
            title={isGuest ? 'เข้าสู่ระบบ' : currentUser?.name || 'โปรไฟล์'}
          >
            <User size={18} color="#ffffff" />
          </button>

          {(currentUser || isGuest) && (
            <button
              type="button"
              className={styles.logoutMiniBtn}
              onClick={() => {
                logout();
                navigate('/');
              }}
              title="ออกจากระบบ / สลับบัญชี"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
