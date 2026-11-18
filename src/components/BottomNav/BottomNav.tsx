import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './BottomNav.module.css';
import { Compass, ArrowLeftRight, Search, User } from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

const BottomNav: React.FC = () => {
  const { db, currentUser } = useDatabase();
  const incomingPendingCount = currentUser
    ? db.requests.filter((r) => r.targetUserId === currentUser.id && r.status === 'Pending').length
    : 0;

  return (
    <nav className={styles.bottomNav}>
      <div className={styles.navContainer}>
        <NavLink
          to="/explore"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <div className={styles.iconWrap}>
            <Compass size={20} />
          </div>
          <span>สำรวจ</span>
        </NavLink>

        <NavLink
          to="/create-request"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <div className={styles.iconWrap}>
            <ArrowLeftRight size={20} />
            {incomingPendingCount > 0 && (
              <span className={styles.navBadge}>{incomingPendingCount}</span>
            )}
          </div>
          <span>คำขอของฉัน</span>
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <div className={styles.iconWrap}>
            <Search size={20} />
          </div>
          <span>ค้นหา</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
        >
          <div className={styles.iconWrap}>
            <User size={20} />
          </div>
          <span>โปรไฟล์</span>
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
