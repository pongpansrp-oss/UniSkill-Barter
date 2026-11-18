import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './MatchEnginePage.module.css';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import {
  ShieldAlert,
  Trash2,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRightLeft,
  Send,
  CheckCircle2,
  Star,
  BadgeCheck,
  Award,
  PlusCircle,
  MinusCircle,
  Megaphone,
  Database,
  RotateCcw,
  Download,
  RefreshCw,
  FileText,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

const MatchEnginePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    db,
    currentUser,
    logout,
    toggleSuspendUserByAdmin,
    toggleVerifyUserByAdmin,
    cycleUserBadgeByAdmin,
    adjustUserXpByAdmin,
    deleteUserByAdmin,
    updateAnnouncementByAdmin,
    clearAllDataByAdmin,
    restoreDemoDataByAdmin,
    exportDatabaseJson,
    deleteRequest,
    renewRequest,
    updateRequestStatus,
    deleteReviewByAdmin,
    resolveReportByAdmin,
    calculateMatchScore,
    getUserRatingStats,
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'match' | 'admin'>(
    location.pathname === '/admin' || currentUser?.role === 'admin' ? 'admin' : 'match'
  );
  const [adminFeedback, setAdminFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [announcementInput, setAnnouncementInput] = useState<string>(
    db.announcement?.text ||
      '🔥 สัปดาห์ติวก่อนสอบกลางภาค! แลกเปลี่ยนทักษะสำเร็จรับโบนัส +80 XP ทันที'
  );
  const [confirmClearStep, setConfirmClearStep] = useState<boolean>(false);

  useEffect(() => {
    if (db.announcement?.text) {
      setAnnouncementInput(db.announcement.text);
    }
  }, [db.announcement?.text]);

  useEffect(() => {
    if (location.pathname === '/admin') {
      setActiveTab('admin');
    } else if (location.pathname === '/match' && currentUser?.role !== 'admin') {
      setActiveTab('match');
    }
  }, [location.pathname, currentUser?.role]);
  const [matchFilter, setMatchFilter] = useState<'all' | 'high' | 'sameUni'>('all');

  const rankedMatches = useMemo(() => {
    const candidates = db.users.filter(
      (u) => u.role === 'student' && u.id !== currentUser?.id && !u.isSuspended
    );
    return candidates
      .map((stu) => ({
        student: stu,
        match: calculateMatchScore(stu),
        rating: getUserRatingStats(stu.id),
      }))
      .filter((item) => {
        if (matchFilter === 'high') return item.match.percent >= 85;
        if (matchFilter === 'sameUni') {
          return currentUser ? item.student.university === currentUser.university : true;
        }
        return true;
      })
      .sort((a, b) => b.match.percent - a.match.percent);
  }, [db.users, currentUser, matchFilter, calculateMatchScore, getUserRatingStats]);

  const studentAccounts = db.users.filter((u) => u.role === 'student');

  return (
    <div className={styles.page}>
      <Header
        title={activeTab === 'admin' ? 'Admin Moderation' : 'Smart Match Engine'}
        showBack
      />

      <main className={styles.mainContent}>
        {/* Mode Switcher */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'match' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('match')}
          >
            <Sparkles size={15} />
            <span>Smart Match ({rankedMatches.length})</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'admin' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('admin')}
          >
            <ShieldAlert size={15} />
            <span>
              Admin & Moderation
              {db.reports.length > 0 ? ` (${db.reports.length})` : ''}
            </span>
          </button>
        </div>

        {activeTab === 'match' ? (
          <>
            {/* Smart Match Hero */}
            <section className={styles.matchHero}>
              <div className={styles.matchHeroTop}>
                <span className={styles.matchHeroBadge}>⚡ AI-Assisted Skill Barter Match</span>
                <span className={styles.matchHeroBadge}>วิเคราะห์จากฐานข้อมูลจริง</span>
              </div>
              <h2 className={styles.matchHeroTitle}>ระบบจับคู่แลกเปลี่ยนทักษะอัตโนมัติ</h2>
              <p className={styles.matchHeroSub}>
                คำนวณความเข้ากันได้จากทักษะที่คุณถนัด ทักษะที่คุณอยากเรียน (Skill Wanted)
                มหาวิทยาลัยเดียวกัน และสถานะความพร้อมในสัปดาห์นี้
              </p>
              {currentUser && (
                <div className={styles.mySwapSummary}>
                  <span>
                    💡 ทักษะของคุณ: {currentUser.skills.map((s) => s.name).join(', ') || '-'}
                  </span>
                  <span>•</span>
                  <span>🎯 ที่อยากเรียน: {currentUser.skillWanted || 'ยังไม่ระบุ'}</span>
                </div>
              )}
            </section>

            {/* Filter Chips */}
            <div className={styles.filterRow}>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  matchFilter === 'all' ? styles.filterChipActive : ''
                }`}
                onClick={() => setMatchFilter('all')}
              >
                ทั้งหมด ({studentAccounts.filter((u) => u.id !== currentUser?.id && !u.isSuspended).length})
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  matchFilter === 'high' ? styles.filterChipActive : ''
                }`}
                onClick={() => setMatchFilter('high')}
              >
                🔥 Match สูง (85%+)
              </button>
              <button
                type="button"
                className={`${styles.filterChip} ${
                  matchFilter === 'sameUni' ? styles.filterChipActive : ''
                }`}
                onClick={() => setMatchFilter('sameUni')}
              >
                🏫 มหาวิทยาลัยเดียวกัน
              </button>
            </div>

            {/* Ranked Match Cards */}
            <div className={styles.matchList}>
              {rankedMatches.map(({ student: stu, match, rating }) => (
                <div key={stu.id} className={styles.matchCard}>
                  <div className={styles.matchCardHeader}>
                    <div className={styles.studentLeft}>
                      <img src={stu.picture} alt={stu.name} className={styles.avatar} />
                      <div>
                        <h3 className={styles.stuName}>
                          {stu.name}
                          {stu.nickname ? ` (${stu.nickname})` : ''}
                        </h3>
                        <p className={styles.stuMeta}>
                          {stu.faculty} • {stu.university}
                        </p>
                        <p className={styles.stuMeta}>
                          <Star
                            size={11}
                            fill="#f59e0b"
                            color="#f59e0b"
                            style={{ display: 'inline', marginRight: 3 }}
                          />
                          {rating.average.toFixed(1)} ({rating.count} รีวิว) •{' '}
                          {stu.isAvailable ? 'ว่างสัปดาห์นี้' : 'คิวเต็มชั่วคราว'}
                        </p>
                      </div>
                    </div>
                    <span className={styles.scoreBadge}>⚡ {match.percent}% Match</span>
                  </div>

                  <div className={styles.swapComparisonBox}>
                    <div className={styles.swapSide}>
                      <span className={styles.swapSideLabel}>เขาสอนคุณได้</span>
                      <span className={styles.swapSideValue}>
                        {match.theirSkillToTeach}
                      </span>
                    </div>
                    <ArrowRightLeft size={16} color="var(--primary)" />
                    <div className={styles.swapSide} style={{ textAlign: 'right' }}>
                      <span className={styles.swapSideLabel}>เขาสนใจเรียน</span>
                      <span className={styles.swapSideValue}>
                        {stu.skillWanted || match.mySkillToTeach}
                      </span>
                    </div>
                  </div>

                  <div className={styles.matchActions}>
                    <button
                      type="button"
                      className={styles.primaryMatchBtn}
                      onClick={() => navigate(`/create-request?target=${stu.id}`)}
                    >
                      <Send size={14} />
                      <span>ส่งคำขอจับคู่แลกทักษะ</span>
                    </button>
                    <button
                      type="button"
                      className={styles.secondaryMatchBtn}
                      onClick={() => navigate(`/student/${stu.id}`)}
                    >
                      ดูโปรไฟล์
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            {adminFeedback && (
              <div
                className={`${styles.feedbackBanner} ${
                  adminFeedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
                }`}
              >
                <span>{adminFeedback.text}</span>
                <button type="button" onClick={() => setAdminFeedback(null)}>
                  ✕
                </button>
              </div>
            )}

            {/* Admin Stats Overview */}
            <section className={styles.adminStatsGrid}>
              <div className={styles.adminStatBox}>
                <span className={styles.adminStatNum}>{studentAccounts.length}</span>
                <span className={styles.adminStatLabel}>นักศึกษา</span>
              </div>
              <div className={styles.adminStatBox}>
                <span className={styles.adminStatNum}>{db.requests.length}</span>
                <span className={styles.adminStatLabel}>คำขอทั้งหมด</span>
              </div>
              <div className={styles.adminStatBox}>
                <span className={styles.adminStatNum}>{db.reports.length}</span>
                <span className={styles.adminStatLabel}>รายงาน (Reports)</span>
              </div>
              <div className={styles.adminStatBox}>
                <span className={styles.adminStatNum}>{db.reviews.length}</span>
                <span className={styles.adminStatLabel}>รีวิวในระบบ</span>
              </div>
            </section>

            {/* 1. Database & Presentation Control */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <Database size={18} color="var(--primary)" />
                <h2 className={styles.sectionTitle}>
                  จัดการฐานข้อมูลสำหรับการนำเสนอ (Database & Demo Control)
                </h2>
              </div>
              <p className={styles.sectionSub}>
                ล้างข้อมูลทั้งหมดเพื่อเริ่มต้นสาธิตการสมัครสมาชิกและส่งคำขอใหม่ตั้งแต่ศูนย์ (เก็บเฉพาะบัญชี Admin) หรือกู้คืนข้อมูลตัวอย่างกลับมาได้ทันทีในคลิกเดียว
              </p>

              {currentUser?.role === 'admin' ? (
                <div className={styles.dbActionGrid}>
                  {!confirmClearStep ? (
                    <button
                      type="button"
                      className={styles.dbClearBtn}
                      onClick={() => setConfirmClearStep(true)}
                    >
                      <Trash2 size={14} />
                      <span>ล้างข้อมูลทั้งหมด (เริ่มนำเสนอใหม่)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={styles.dbClearBtn}
                      onClick={async () => {
                        const res = await clearAllDataByAdmin();
                        setConfirmClearStep(false);
                        setAdminFeedback({
                          type: res.ok ? 'success' : 'error',
                          text: res.message || '',
                        });
                      }}
                    >
                      <Trash2 size={14} />
                      <span>⚠️ ยืนยันล้างข้อมูลทั้งหมดทันที!</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className={styles.dbRestoreBtn}
                    onClick={async () => {
                      setConfirmClearStep(false);
                      const res = await restoreDemoDataByAdmin();
                      setAdminFeedback({
                        type: res.ok ? 'success' : 'error',
                        text: res.message || '',
                      });
                    }}
                  >
                    <RotateCcw size={14} />
                    <span>กู้คืนข้อมูลตัวอย่าง (Restore Demo)</span>
                  </button>

                  <button
                    type="button"
                    className={styles.dbExportBtn}
                    onClick={exportDatabaseJson}
                  >
                    <Download size={14} />
                    <span>ดาวน์โหลดไฟล์ฐานข้อมูลปัจจุบัน (use-database.json)</span>
                  </button>

                  <button
                    type="button"
                    className={styles.dbExportBtn}
                    onClick={() => {
                      logout();
                      navigate('/');
                    }}
                  >
                    <span>🚪 ออกจากระบบ Admin / สลับไปหน้าเข้าสู่ระบบนักศึกษา</span>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <p className={styles.adminRowSub}>
                    กรุณาเข้าสู่ระบบด้วยบัญชี Admin (admin@student.university.ac.th / admin123) เพื่อใช้งานปุ่มจัดการฐานข้อมูล
                  </p>
                  <button
                    type="button"
                    className={styles.primaryMatchBtn}
                    onClick={() => navigate('/')}
                  >
                    <span>ไปหน้าเข้าสู่ระบบ (Login as Admin)</span>
                  </button>
                </div>
              )}
            </section>

            {/* 2. University Announcement Banner */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <Megaphone size={18} color="var(--primary)" />
                <h2 className={styles.sectionTitle}>
                  ประกาศข่าวสารระดับมหาวิทยาลัย (University Announcement)
                </h2>
              </div>
              <p className={styles.sectionSub}>
                สถานะปัจจุบัน:{' '}
                {db.announcement?.active && db.announcement?.text
                  ? `🟢 กำลังแสดงผลหน้าแรก ("${db.announcement.text}")`
                  : '⚪ ปิดการแสดงผล'}
              </p>

              <input
                type="text"
                className={styles.announceInput}
                placeholder="พิมพ์ข้อความประกาศที่จะแสดงบนหน้า Explore ของทุกบัญชี..."
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                disabled={currentUser?.role !== 'admin'}
              />

              {currentUser?.role === 'admin' && (
                <div className={styles.announceBtnRow}>
                  <button
                    type="button"
                    className={styles.primaryMatchBtn}
                    onClick={async () => {
                      const res = await updateAnnouncementByAdmin(announcementInput, true);
                      setAdminFeedback({
                        type: res.ok ? 'success' : 'error',
                        text: res.message || '',
                      });
                    }}
                  >
                    <Megaphone size={14} />
                    <span>เผยแพร่ประกาศขึ้นหน้าแรก</span>
                  </button>
                  {db.announcement?.active && (
                    <button
                      type="button"
                      className={styles.secondaryMatchBtn}
                      onClick={async () => {
                        const res = await updateAnnouncementByAdmin(announcementInput, false);
                        setAdminFeedback({
                          type: res.ok ? 'success' : 'error',
                          text: res.message || '',
                        });
                      }}
                    >
                      ปิดประกาศ
                    </button>
                  )}
                </div>
              )}
            </section>

            {/* 3. User Management Section */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <ShieldAlert size={18} color="var(--primary)" />
                <h2 className={styles.sectionTitle}>
                  จัดการบัญชีนักศึกษา ยืนยันตัวตน และ XP ({studentAccounts.length} บัญชี)
                </h2>
              </div>
              <p className={styles.sectionSub}>
                เงื่อนไขระบบ: หากผู้ใช้ถูก Report ครบ 3 ครั้ง บัญชีจะถูกระงับชั่วคราวโดยอัตโนมัติ • Admin สามารถอนุมัติ Verified, มอบป้ายพิเศษ, ปรับ XP, ระงับ หรือลบบัญชีได้
                {currentUser?.role !== 'admin' &&
                  ' (เข้าสู่ระบบด้วยบัญชี Admin เพื่อดำเนินการ)'}
              </p>

              {studentAccounts.length === 0 ? (
                <p className={styles.adminRowSub}>
                  ยังไม่มีบัญชีนักศึกษาในระบบ (สามารถสมัครสมาชิกใหม่ หรือกด "กู้คืนข้อมูลตัวอย่าง" ด้านบน)
                </p>
              ) : (
                <div className={styles.itemList}>
                  {studentAccounts.map((u) => (
                    <div key={u.id} className={styles.adminUserCard}>
                      <div className={styles.adminUserHeader}>
                        <div>
                          <div className={styles.adminRowTitle}>
                            {u.name}{' '}
                            {u.isSuspended && (
                              <span style={{ color: 'var(--danger)', fontSize: '11px' }}>
                                (ถูกระงับชั่วคราว)
                              </span>
                            )}
                          </div>
                          <div className={styles.adminRowSub}>
                            {u.email} • {u.university} ({u.faculty}) • ถูกรายงาน {u.reportCount}/3 ครั้ง
                          </div>
                          <div className={styles.adminBadgeRow}>
                            <span className={styles.miniBadgeVerified}>
                              {u.isVerified ? '✓ Verified (@student)' : 'ยังไม่ยืนยันตัวตน'}
                            </span>
                            {u.badgeText && (
                              <span className={styles.miniBadgeCustom}>🏷️ {u.badgeText}</span>
                            )}
                            <span className={styles.miniBadgeXp}>
                              ⚡ {(u.xp || 0).toLocaleString()} XP • {u.levelTitle}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.adminSmallBtn}
                          onClick={() => navigate(`/student/${u.id}`)}
                        >
                          ดูโปรไฟล์
                        </button>
                      </div>

                      {currentUser?.role === 'admin' && (
                        <div className={styles.adminActionWrap}>
                          <button
                            type="button"
                            className={styles.adminSmallBtnPrimary}
                            onClick={async () => {
                              const res = await toggleVerifyUserByAdmin(u.id);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                          >
                            <BadgeCheck size={13} />
                            <span>{u.isVerified ? 'ยกเลิก Verified' : 'อนุมัติ Verified'}</span>
                          </button>

                          <button
                            type="button"
                            className={styles.adminSmallBtn}
                            onClick={async () => {
                              const res = await cycleUserBadgeByAdmin(u.id);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                          >
                            <Award size={13} />
                            <span>เปลี่ยนป้ายพิเศษ</span>
                          </button>

                          <button
                            type="button"
                            className={styles.adminSmallBtn}
                            onClick={async () => {
                              const res = await adjustUserXpByAdmin(u.id, 100);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                          >
                            <PlusCircle size={13} />
                            <span>+100 XP</span>
                          </button>

                          <button
                            type="button"
                            className={styles.adminSmallBtn}
                            onClick={async () => {
                              const res = await adjustUserXpByAdmin(u.id, -100);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                          >
                            <MinusCircle size={13} />
                            <span>-100 XP</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleSuspendUserByAdmin(u.id)}
                            className={u.isSuspended ? styles.unsuspendBtn : styles.suspendBtn}
                          >
                            {u.isSuspended ? <UserCheck size={13} /> : <UserX size={13} />}
                            <span>{u.isSuspended ? 'ปลดระงับ' : 'ระงับบัญชี'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              const res = await deleteUserByAdmin(u.id);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                            className={styles.suspendBtn}
                            title="ลบบัญชีผู้ใช้นี้ออกจากระบบถาวร"
                          >
                            <Trash2 size={13} />
                            <span>ลบบัญชี</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 4. All Help Requests Moderation */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <FileText size={18} color="var(--primary)" />
                <h3 className={styles.sectionTitle}>
                  จัดการคำขอแลกเปลี่ยนทักษะทั้งหมด ({db.requests.length} รายการ)
                </h3>
              </div>
              {db.requests.length === 0 ? (
                <p className={styles.adminRowSub}>ยังไม่มีคำขอแลกเปลี่ยนทักษะในระบบขณะนี้</p>
              ) : (
                <div className={styles.itemList}>
                  {db.requests.map((req) => (
                    <div key={req.id} className={styles.adminUserCard}>
                      <div className={styles.adminUserHeader}>
                        <div>
                          <div className={styles.adminRowTitle}>
                            {req.title}{' '}
                            <span className={styles.miniBadgeXp}>[{req.status}]</span>
                          </div>
                          <div className={styles.adminRowSub}>
                            ผู้ขอ: {req.requesterName}
                            {req.targetUserName ? ` ➔ ส่งถึง: ${req.targetUserName}` : ' (🌐 กระดานสาธารณะ)'}{' '}
                            • ต้องการ: {req.skillNeeded} ⇄ แลกกับ: {req.skillOffered}
                          </div>
                        </div>
                      </div>

                      {currentUser?.role === 'admin' && (
                        <div className={styles.adminActionWrap}>
                          {req.status !== 'Completed' && (
                            <button
                              type="button"
                              className={styles.unsuspendBtn}
                              onClick={async () => {
                                await updateRequestStatus(req.id, 'Completed');
                                setAdminFeedback({
                                  type: 'success',
                                  text: `เปลี่ยนสถานะคำขอ "${req.title}" เป็น Completed (+80 XP) แล้ว`,
                                });
                              }}
                            >
                              <CheckCircle2 size={13} />
                              <span>อนุมัติเสร็จสิ้น (Completed)</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className={styles.adminSmallBtn}
                            onClick={async () => {
                              const res = await renewRequest(req.id);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                          >
                            <RefreshCw size={13} />
                            <span>ต่ออายุ (+7 วัน / Pending)</span>
                          </button>

                          <button
                            type="button"
                            className={styles.suspendBtn}
                            onClick={async () => {
                              const res = await deleteRequest(req.id);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                          >
                            <Trash2 size={13} />
                            <span>ลบคำขอ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 5. Reports Log */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>
                  ประวัติการรายงานพฤติกรรมไม่เหมาะสม (Reports: {db.reports.length})
                </h3>
              </div>
              {db.reports.length === 0 ? (
                <p className={styles.adminRowSub}>ยังไม่มีการรายงานพฤติกรรมไม่เหมาะสมในขณะนี้</p>
              ) : (
                <div className={styles.itemList}>
                  {db.reports.map((rep) => (
                    <div key={rep.id} className={styles.adminRow}>
                      <div>
                        <div className={styles.adminRowTitle}>
                          ผู้ถูกรายงาน: {rep.targetUserName} ({rep.reason}){' '}
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: rep.status === 'Resolved' ? '#16a34a' : '#f59e0b',
                            }}
                          >
                            [{rep.status === 'Resolved' ? 'ตรวจสอบแล้ว' : 'รอตรวจสอบ'}]
                          </span>
                        </div>
                        <div className={styles.adminRowSub}>
                          {rep.detail} • แจ้งโดย {rep.reporterName}
                        </div>
                      </div>
                      {rep.status === 'Resolved' ? (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#16a34a',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <CheckCircle2 size={14} />
                          <span>เคลียร์แล้ว</span>
                        </span>
                      ) : (
                        currentUser?.role === 'admin' && (
                          <button
                            type="button"
                            className={styles.resolveBtn}
                            onClick={async () => {
                              const res = await resolveReportByAdmin(rep.id);
                              setAdminFeedback({
                                type: res.ok ? 'success' : 'error',
                                text: res.message || '',
                              });
                            }}
                            title="ตรวจสอบแล้ว / เคลียร์รายการรายงานนี้"
                          >
                            <CheckCircle2 size={13} />
                            <span>เคลียร์รายงาน</span>
                          </button>
                        )
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 6. Admin Review Moderation */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionTitleRow}>
                <h3 className={styles.sectionTitle}>
                  ตรวจสอบรีวิวทั้งหมด ({db.reviews.length} รีวิว)
                </h3>
              </div>
              {db.reviews.length === 0 ? (
                <p className={styles.adminRowSub}>ยังไม่มีรีวิวในระบบขณะนี้</p>
              ) : (
                <div className={styles.itemList}>
                  {db.reviews.map((rev) => (
                    <div key={rev.id} className={styles.adminRow}>
                      <div>
                        <div className={styles.adminRowTitle}>
                          {rev.reviewerName} (★ {rev.rate.toFixed(1)}) • {rev.skillExchanged}
                        </div>
                        <div className={styles.adminRowSub}>"{rev.comment}"</div>
                      </div>
                      {currentUser?.role === 'admin' && (
                        <button
                          type="button"
                          onClick={async () => {
                            await deleteReviewByAdmin(rev.id);
                            setAdminFeedback({
                              type: 'success',
                              text: 'ลบรีวิวที่ไม่เหมาะสมออกจากระบบเรียบร้อยแล้ว',
                            });
                          }}
                          className={styles.suspendBtn}
                          title="ลบรีวิวไม่เหมาะสม"
                        >
                          <Trash2 size={13} />
                          <span>ลบรีวิว</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default MatchEnginePage;
