import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreditPage.module.css';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import {
  Clock,
  Award,
  CheckCircle2,
  Star,
  ArrowRightLeft,
  PlusCircle,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

function getNextLevelProgress(xp: number): {
  currentRank: string;
  nextRank: string;
  nextXp: number;
  percent: number;
} {
  if (xp < 600) {
    return {
      currentRank: 'Lv.1 Newcomer Peer',
      nextRank: 'Lv.2 Skill Explorer',
      nextXp: 600,
      percent: Math.min(100, Math.round((xp / 600) * 100)),
    };
  }
  if (xp < 800) {
    return {
      currentRank: 'Lv.2 Skill Explorer',
      nextRank: 'Lv.3 Active Sharer',
      nextXp: 800,
      percent: Math.min(100, Math.round(((xp - 600) / (800 - 600)) * 100)),
    };
  }
  if (xp < 1200) {
    return {
      currentRank: 'Lv.3 Active Sharer',
      nextRank: 'Lv.4 Peer Mentor',
      nextXp: 1200,
      percent: Math.min(100, Math.round(((xp - 800) / (1200 - 800)) * 100)),
    };
  }
  if (xp < 1800) {
    return {
      currentRank: 'Lv.4 Peer Mentor',
      nextRank: 'Lv.5 Master Mentor',
      nextXp: 1800,
      percent: Math.min(100, Math.round(((xp - 1200) / (1800 - 1200)) * 100)),
    };
  }
  return {
    currentRank: 'Lv.5 Master Mentor',
    nextRank: 'Max Level',
    nextXp: xp,
    percent: 100,
  };
}

const CreditPage: React.FC = () => {
  const navigate = useNavigate();
  const { db, currentUser, getUserRatingStats } = useDatabase();

  const xp = currentUser?.xp ?? 0;
  const exchangeCount = currentUser?.exchangeCount ?? 0;
  const creditHours = (exchangeCount * 1.5).toFixed(1);
  const progressInfo = getNextLevelProgress(xp);
  const ratingStats = currentUser ? getUserRatingStats(currentUser.id) : { average: 0, count: 0, reviews: [] };

  const myCompletedRequests = db.requests.filter(
    (r) =>
      r.status === 'Completed' &&
      Boolean(
        currentUser && (r.requesterId === currentUser.id || r.targetUserId === currentUser.id)
      )
  );

  const myAcceptedRequests = db.requests.filter(
    (r) =>
      r.status === 'Accepted' &&
      currentUser &&
      (r.requesterId === currentUser.id || r.targetUserId === currentUser.id)
  );

  const badges = [
    {
      icon: '🎓',
      name: 'Verified Student',
      desc: 'ยืนยันอีเมลสถาบันแล้ว',
      unlocked: Boolean(currentUser),
    },
    {
      icon: '🤝',
      name: 'First Barter',
      desc: 'แลกเปลี่ยนทักษะสำเร็จครั้งแรก',
      unlocked: exchangeCount >= 1,
    },
    {
      icon: '⚡',
      name: 'Pro Swapper',
      desc: 'แลกเปลี่ยนครบ 5 ครั้งขึ้นไป',
      unlocked: exchangeCount >= 5,
    },
    {
      icon: '⭐',
      name: 'Top Mentor',
      desc: 'คะแนนรีวิวเฉลี่ย 4.8+ ดาว',
      unlocked: ratingStats.count > 0 && ratingStats.average >= 4.8,
    },
  ];

  return (
    <div className={styles.page}>
      <Header title="Time Credit & XP" showBack />

      <main className={styles.mainContent}>
        {/* Wallet Hero Card */}
        <section className={styles.walletHero}>
          <div className={styles.walletTopRow}>
            <span className={styles.walletBadge}>
              ⏱️ กระเป๋าเครดิตเวลาแลกทักษะ (Time Bank)
            </span>
            <span className={styles.walletBadge}>
              {currentUser?.levelTitle || progressInfo.currentRank}
            </span>
          </div>

          <div className={styles.walletBalanceRow}>
            <div className={styles.creditMain}>
              <span className={styles.creditValue}>{creditHours} ชั่วโมง</span>
              <span className={styles.creditSub}>
                สะสมจากการแลกเปลี่ยนสำเร็จ {exchangeCount} ครั้ง (ครั้งละ 1.5 ชม.)
              </span>
            </div>
            <div className={styles.xpBox}>
              <div className={styles.xpValue}>{xp.toLocaleString()} XP</div>
              <div className={styles.xpSub}>แต้มประสบการณ์</div>
            </div>
          </div>

          <div className={styles.progressSection}>
            <div className={styles.progressLabels}>
              <span>ระดับปัจจุบัน: {progressInfo.currentRank}</span>
              <span>
                {progressInfo.nextRank === 'Max Level'
                  ? 'ถึงระดับสูงสุดแล้ว!'
                  : `อีก ${progressInfo.nextXp - xp} XP ขึ้นเป็น ${progressInfo.nextRank}`}
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressInfo.percent}%` }}
              />
            </div>
          </div>
        </section>

        {/* Quick Summary Stats */}
        <section className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statNum}>+80 XP</span>
            <span className={styles.statLabel}>ต่อการแลกเปลี่ยนสำเร็จ</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>+15 XP</span>
            <span className={styles.statLabel}>ต่อการเขียนรีวิวเพื่อน</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNum}>{myAcceptedRequests.length} นัดหมาย</span>
            <span className={styles.statLabel}>กำลังดำเนินการ</span>
          </div>
        </section>

        {/* Badges & Achievements */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <Award size={17} color="var(--primary)" />
              <h2 className={styles.sectionTitle}>เหรียญตราความสำเร็จ (Achievements)</h2>
            </div>
          </div>

          <div className={styles.badgeGrid}>
            {badges.map((b, idx) => (
              <div
                key={idx}
                className={`${styles.badgeItem} ${
                  b.unlocked ? styles.badgeUnlocked : styles.badgeLocked
                }`}
              >
                <span className={styles.badgeIcon}>{b.icon}</span>
                <div>
                  <div className={styles.badgeName}>
                    {b.name} {b.unlocked ? '✓' : '🔒'}
                  </div>
                  <div className={styles.badgeDesc}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Completed Exchange Ledger */}
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <Clock size={17} color="var(--primary)" />
              <h2 className={styles.sectionTitle}>
                ประวัติการเคลื่อนไหวเครดิตเวลาและ XP ({myCompletedRequests.length})
              </h2>
            </div>
          </div>

          <div className={styles.ledgerList}>
            {myCompletedRequests.length === 0 ? (
              <p className={styles.emptyText}>
                ยังไม่มีประวัติการแลกเปลี่ยนที่เสร็จสมบูรณ์ เริ่มสร้างคำขอหรือตอบรับคำขอเพื่อสะสมเครดิตเวลา!
              </p>
            ) : (
              myCompletedRequests.map((req) => {
                const isRequester = currentUser?.id === req.requesterId;
                const partnerName = isRequester
                  ? req.targetUserName || 'เพื่อนนักศึกษา'
                  : req.requesterName;

                return (
                  <div key={req.id} className={styles.ledgerItem}>
                    <div className={styles.ledgerLeft}>
                      <div className={styles.ledgerIconBox}>
                        <ArrowRightLeft size={16} />
                      </div>
                      <div>
                        <h4 className={styles.ledgerTitle}>{req.title}</h4>
                        <p className={styles.ledgerMeta}>
                          แลกเปลี่ยน {req.skillNeeded} ⇄ {req.skillOffered} กับ {partnerName} •{' '}
                          {req.date}
                        </p>
                      </div>
                    </div>
                    <div className={styles.ledgerRight}>
                      <div className={styles.ledgerPlusCredit}>+1.5 ชม.</div>
                      <div className={styles.ledgerPlusXp}>+80 XP</div>
                    </div>
                  </div>
                );
              })
            )}

            {ratingStats.reviews.slice(0, 3).map((rev) => (
              <div key={rev.id} className={styles.ledgerItem}>
                <div className={styles.ledgerLeft}>
                  <div className={styles.ledgerIconBox}>
                    <Star size={16} />
                  </div>
                  <div>
                    <h4 className={styles.ledgerTitle}>
                      ได้รับรีวิว ★ {rev.rate.toFixed(1)} จาก {rev.reviewerName}
                    </h4>
                    <p className={styles.ledgerMeta}>
                      ทักษะ: {rev.skillExchanged} • {rev.timeAgo || 'เมื่อเร็วๆ นี้'}
                    </p>
                  </div>
                </div>
                <div className={styles.ledgerRight}>
                  <div className={styles.ledgerPlusXp}>Verified</div>
                  <div className={styles.ledgerMeta}>
                    <CheckCircle2 size={12} color="#16a34a" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => navigate('/create-request')}
          >
            <PlusCircle size={16} />
            <span>ไปที่หน้าคำขอแลกเปลี่ยนทักษะ (Requests)</span>
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default CreditPage;
