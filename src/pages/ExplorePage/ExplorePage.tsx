import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ExplorePage.module.css';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import {
  Star,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Monitor,
  MapPin,
  Zap,
  ArrowLeftRight,
  BadgeCheck,
  Code2,
  Palette,
  Languages,
  Headphones,
  BookOpen,
  ChevronRight,
  Video,
  Handshake,
  Plus,
  Clock,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const {
    db,
    currentUser,
    isGuest,
    getUserRatingStats,
    offerHelpOnRequest,
    calculateMatchScore,
  } = useDatabase();

  const [searchQuery, setSearchQuery] = useState('');
  const [meetingFilter, setMeetingFilter] = useState<'all' | 'Online' | 'Onsite'>('all');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const displayName = isGuest
    ? 'ผู้เยี่ยมชม (Guest)'
    : currentUser?.nickname || currentUser?.name.split(' ')[0] || 'นักศึกษา';

  const displayFaculty = isGuest
    ? 'โหมดผู้เยี่ยมชม • ค้นหาและดูรีวิวได้อิสระ'
    : `${currentUser?.faculty || ''} • ${currentUser?.university || ''}`;

  // Dynamic Smart Match: find the highest scoring peer excluding currentUser
  const bestMatchData = useMemo(() => {
    const candidates = db.users.filter(
      (u) => u.role === 'student' && !u.isSuspended && u.id !== currentUser?.id
    );
    if (candidates.length === 0) return null;

    const scored = candidates.map((stu) => ({
      user: stu,
      match: calculateMatchScore(stu),
    }));
    scored.sort((a, b) => b.match.percent - a.match.percent);
    return scored[0];
  }, [db.users, currentUser, calculateMatchScore]);

  const recommendedStudents = useMemo(() => {
    return db.users
      .filter((u) => u.role === 'student' && !u.isSuspended && u.id !== currentUser?.id)
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        return getUserRatingStats(b.id).average - getUserRatingStats(a.id).average;
      });
  }, [db.users, currentUser, getUserRatingStats]);

  // Dynamic category counts from db.users
  const categoryCounts = useMemo(() => {
    const activeStudents = db.users.filter((u) => u.role === 'student' && !u.isSuspended);
    const hasDemoSeed = activeStudents.some((u) => u.id === 'u-kawin');
    const countCat = (cat: string, base: number) =>
      (hasDemoSeed ? base : 0) +
      activeStudents.filter((u) => u.skills.some((s) => s.category === cat)).length;
    return {
      coding: countCat('coding', 138),
      design: countCat('design', 94),
      language: countCat('language', 85),
      music: countCat('music', 44),
    };
  }, [db.users]);

  const filteredRequests = db.requests.filter((req) => {
    if (req.status === 'Expired' || req.status === 'Rejected') return false;
    // Only show public requests or requests involving currentUser on the board
    if (
      req.targetUserId &&
      req.targetUserId !== currentUser?.id &&
      req.requesterId !== currentUser?.id
    ) {
      return false;
    }
    if (meetingFilter !== 'all' && req.meetingType !== meetingFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        req.title.toLowerCase().includes(q) ||
        req.detail.toLowerCase().includes(q) ||
        req.skillNeeded.toLowerCase().includes(q) ||
        req.skillOffered.toLowerCase().includes(q) ||
        req.requesterFaculty.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOfferHelp = async (requestId: string) => {
    const res = await offerHelpOnRequest(requestId);
    if (!res.ok) {
      setFeedbackMsg({ type: 'error', text: res.message || 'ไม่สามารถดำเนินการได้' });
      return;
    }
    setFeedbackMsg({
      type: 'success',
      text: 'ตอบรับคำขอสำเร็จ! ระบบได้บันทึกข้อมูลลง JSON และเปิดเผยช่องทางติดต่อในหน้า "คำขอของฉัน" แล้ว',
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const incomingPendingRequests = currentUser
    ? db.requests.filter((r) => r.targetUserId === currentUser.id && r.status === 'Pending')
    : [];

  return (
    <div className={styles.page}>
      <Header title="Explore" />

      <main className={styles.mainContent}>
        {db.announcement?.active && db.announcement?.text && (
          <div
            className={`${styles.feedbackBanner} ${styles.feedbackSuccess}`}
            style={{
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              color: '#92400e',
              borderColor: '#f59e0b',
            }}
          >
            <span>📢 ประกาศมหาวิทยาลัย: {db.announcement.text}</span>
          </div>
        )}

        {incomingPendingRequests.length > 0 && (
          <div
            className={`${styles.feedbackBanner} ${styles.feedbackSuccess}`}
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/create-request')}
          >
            <span>
              🔔 คุณมีคำขอแลกเปลี่ยนทักษะส่งถึงคุณโดยตรง {incomingPendingRequests.length} รายการ (จาก{' '}
              {incomingPendingRequests.map((r) => r.requesterName).join(', ')}) — แตะเพื่อเปิดดูและกดยอมรับ
            </span>
            <ChevronRight size={16} />
          </div>
        )}

        {feedbackMsg && (
          <div
            className={`${styles.feedbackBanner} ${
              feedbackMsg.type === 'error' ? styles.feedbackError : styles.feedbackSuccess
            }`}
          >
            <span>{feedbackMsg.text}</span>
            <button type="button" onClick={() => setFeedbackMsg(null)}>
              ✕
            </button>
          </div>
        )}

        {/* Greeting & XP Card */}
        <section className={styles.greetingCard}>
          <div className={styles.greetingTop}>
            <div className={styles.greetingInfo}>
              <h1 className={styles.greetingTitle}>สวัสดี {displayName} 👋</h1>
              <p className={styles.greetingFaculty}>{displayFaculty}</p>
            </div>
            <div className={styles.levelRight}>
              <span className={styles.levelLabel}>ระดับปัจจุบัน</span>
              <div
                className={styles.levelPill}
                onClick={() => navigate('/credit')}
                title="ดูรายละเอียดระดับและเครดิตเวลา"
              >
                {currentUser?.levelTitle || (isGuest ? 'Guest Mode' : 'Lv.4 Peer Mentor')}
              </div>
            </div>
          </div>

          <div
            className={styles.xpBox}
            onClick={() => navigate('/credit')}
            title="เปิดกระเป๋าเครดิตเวลาและประวัติ XP"
          >
            <div className={styles.xpLeft}>
              <div className={styles.xpIconCircle}>
                <Star size={16} fill="#ffffff" color="#ffffff" />
              </div>
              <div className={styles.xpTexts}>
                <span className={styles.xpLabel}>คะแนนความน่าเชื่อถือ & เครดิตเวลา</span>
                <div className={styles.xpValue}>
                  {(currentUser?.xp ?? 0).toLocaleString()}{' '}
                  <span className={styles.xpUnit}>
                    XP • {((currentUser?.exchangeCount || 0) * 1.5).toFixed(1)} ชม.
                  </span>
                </div>
              </div>
            </div>
            <div className={styles.walletLinkPill}>
              <Clock size={12} />
              <span>กระเป๋าเครดิต</span>
            </div>
          </div>
        </section>

        {/* Search Bar */}
        <form className={styles.searchRow} onSubmit={handleSearchSubmit}>
          <div className={styles.searchBox}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="ค้นหาทักษะหรือคณะ (เช่น สอน Python, ตัดต่อ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className={styles.filterIconBtn}
              onClick={() => navigate(`/search?q=${encodeURIComponent(searchQuery)}`)}
              aria-label="ตัวกรองการค้นหา"
            >
              <SlidersHorizontal size={16} color="var(--text-main)" />
            </button>
          </div>
        </form>

        {/* Mode Filter Pills */}
        <div className={styles.modePills}>
          <button
            type="button"
            className={`${styles.modePill} ${meetingFilter === 'all' ? styles.modePillActive : ''}`}
            onClick={() => setMeetingFilter('all')}
          >
            <LayoutGrid size={14} />
            <span>ทั้งหมด</span>
          </button>
          <button
            type="button"
            className={`${styles.modePill} ${meetingFilter === 'Online' ? styles.modePillActive : ''}`}
            onClick={() => setMeetingFilter('Online')}
          >
            <Monitor size={14} />
            <span>Online</span>
          </button>
          <button
            type="button"
            className={`${styles.modePill} ${meetingFilter === 'Onsite' ? styles.modePillActive : ''}`}
            onClick={() => setMeetingFilter('Onsite')}
          >
            <MapPin size={14} />
            <span>Onsite (ในมหาลัย)</span>
          </button>
        </div>

        {/* Smart Match Card */}
        {bestMatchData && (
          <section className={styles.smartMatchCard}>
            <div className={styles.smartMatchHeader}>
              <div className={styles.smartMatchTitleWrap}>
                <div className={styles.zapCircle}>
                  <Zap size={14} color="#f59e0b" fill="#f59e0b" />
                </div>
                <h2 className={styles.smartMatchTitle}>Smart Match แนะนำอัตโนมัติ</h2>
              </div>
              <span
                className={styles.matchPercentBadge}
                onClick={() => navigate('/match')}
              >
                ตรงกัน {bestMatchData.match.percent}%
              </span>
            </div>

            <p className={styles.smartMatchDesc}>
              ระบบจับคู่ทักษะที่คุณชำนาญ แลกเปลี่ยนกับเพื่อนที่มีทักษะที่คุณอยากเรียนรู้ เพื่อการเติบโตไปด้วยกัน
            </p>

            <div className={styles.exchangeSwapBox}>
              <div className={styles.swapSide}>
                <span className={styles.swapLabel}>คุณสอนได้</span>
                <span className={styles.swapSkill}>
                  {bestMatchData.match.mySkillToTeach}
                </span>
              </div>
              <div className={styles.swapArrowCircle}>
                <ArrowLeftRight size={14} color="var(--primary)" />
              </div>
              <div className={styles.swapSide}>
                <span className={styles.swapLabel}>คุณจะได้เรียน</span>
                <span className={styles.swapSkill}>
                  {bestMatchData.match.theirSkillToTeach}
                </span>
              </div>
            </div>

            <div className={styles.matchedPersonRow}>
              <div
                className={styles.matchedPersonInfo}
                onClick={() => navigate(`/student/${bestMatchData.user.id}`)}
              >
                <img
                  src={bestMatchData.user.picture}
                  alt={bestMatchData.user.name}
                  className={styles.matchedAvatar}
                />
                <div>
                  <h4 className={styles.matchedName}>{bestMatchData.user.name}</h4>
                  <p className={styles.matchedSub}>
                    {bestMatchData.user.major} ปี {bestMatchData.user.year}
                  </p>
                </div>
              </div>
              <div className={styles.matchedBtns}>
                <button
                  type="button"
                  className={styles.viewOfferBtn}
                  onClick={() => navigate(`/student/${bestMatchData.user.id}`)}
                >
                  ดูข้อเสนอ
                </button>
                <button
                  type="button"
                  className={styles.allMatchesBtn}
                  onClick={() => navigate('/match')}
                >
                  จับคู่ทั้งหมด
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Popular Recommended Students */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionHeading}>🔥 นักศึกษาแนะนำยอดนิยม</h2>
            <button
              type="button"
              className={styles.seeAllLink}
              onClick={() => navigate('/search')}
            >
              ดูทั้งหมด
            </button>
          </div>

          {recommendedStudents.length === 0 ? (
            <div className={styles.urgentCard}>
              <p className={styles.urgentDetail}>
                ยังไม่มีเพื่อนนักศึกษาคนอื่นในระบบขณะนี้ สามารถสมัครบัญชีนักศึกษาเพิ่มเพื่อเริ่มจับคู่แลกเปลี่ยนทักษะได้เลย!
              </p>
            </div>
          ) : (
            <div className={styles.horizontalScroll}>
              {recommendedStudents.map((stu) => {
                const stats = getUserRatingStats(stu.id);
                return (
                  <div key={stu.id} className={styles.popularStudentCard}>
                    <div
                      className={styles.popTopRow}
                      onClick={() => navigate(`/student/${stu.id}`)}
                    >
                      <div className={styles.popAvatarWrap}>
                        <img src={stu.picture} alt={stu.name} className={styles.popAvatar} />
                        {stu.isVerified && (
                          <span className={styles.popVerifiedIcon}>
                            <BadgeCheck size={14} fill="var(--primary)" color="#ffffff" />
                          </span>
                        )}
                      </div>
                      <div className={styles.popMeta}>
                        <h3 className={styles.popName}>{stu.name}</h3>
                        <p className={styles.popFaculty}>
                          {stu.faculty.replace('คณะ', '')} • ปี {stu.year}
                        </p>
                        <div className={styles.popRating}>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span className={styles.popRateNum}>{stats.average.toFixed(1)}</span>
                          <span className={styles.popRateCount}>({stats.count} รีวิว)</span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.popTags}>
                      {stu.skills.slice(0, 2).map((sk, idx) => (
                        <span
                          key={idx}
                          className={idx === 0 ? styles.popTagPrimary : styles.popTagSecondary}
                        >
                          {sk.name}
                        </span>
                      ))}
                    </div>

                    <div className={styles.popBottomRow}>
                      <div className={stu.isAvailable ? styles.availStatus : styles.busyStatus}>
                        <span className={stu.isAvailable ? styles.greenDot : styles.grayDot}></span>
                        <span>{stu.isAvailable ? 'ว่างนัดสัปดาห์นี้' : 'คิวเต็มชั่วคราว'}</span>
                      </div>
                      <button
                        type="button"
                        className={styles.bookBtn}
                        onClick={() => navigate(`/student/${stu.id}`)}
                      >
                        นัดหมาย
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Popular Skill Categories (5 Categories) */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionHeading}>หมวดหมู่ทักษะยอดนิยม</h2>
            <span className={styles.categoryCountText}>5 หมวดหมู่</span>
          </div>

          <div className={styles.categoryGrid}>
            <div
              className={styles.categoryCard}
              onClick={() => navigate('/search?category=coding')}
            >
              <div className={styles.catIconCircle}>
                <Code2 size={18} color="var(--primary)" />
              </div>
              <div className={styles.catTexts}>
                <h4 className={styles.catTitle}>Tech & Coding</h4>
                <span className={styles.catSub}>{categoryCounts.coding} ผู้สอน</span>
              </div>
            </div>

            <div
              className={styles.categoryCard}
              onClick={() => navigate('/search?category=design')}
            >
              <div className={styles.catIconCircle}>
                <Palette size={18} color="var(--primary)" />
              </div>
              <div className={styles.catTexts}>
                <h4 className={styles.catTitle}>Design & Art</h4>
                <span className={styles.catSub}>{categoryCounts.design} ผู้สอน</span>
              </div>
            </div>

            <div
              className={styles.categoryCard}
              onClick={() => navigate('/search?category=language')}
            >
              <div className={styles.catIconCircle}>
                <Languages size={18} color="var(--primary)" />
              </div>
              <div className={styles.catTexts}>
                <h4 className={styles.catTitle}>Languages</h4>
                <span className={styles.catSub}>{categoryCounts.language} ผู้สอน</span>
              </div>
            </div>

            <div
              className={styles.categoryCard}
              onClick={() => navigate('/search?category=music')}
            >
              <div className={styles.catIconCircle}>
                <Headphones size={18} color="var(--primary)" />
              </div>
              <div className={styles.catTexts}>
                <h4 className={styles.catTitle}>Music & Media</h4>
                <span className={styles.catSub}>{categoryCounts.music} ผู้สอน</span>
              </div>
            </div>

            <div
              className={`${styles.categoryCard} ${styles.categoryCardFull}`}
              onClick={() => navigate('/search?category=academic')}
            >
              <div className={styles.catFullLeft}>
                <div className={styles.catIconCircle}>
                  <BookOpen size={18} color="var(--primary)" />
                </div>
                <div className={styles.catTexts}>
                  <h4 className={styles.catTitle}>Academic & Research</h4>
                  <span className={styles.catSub}>สถิติวิจัย, SPSS, เตรียมสอบกลางภาค</span>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-muted)" />
            </div>
          </div>
        </section>

        {/* Urgent Help Requests in University */}
        <section className={styles.sectionBlock}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.urgentTitleWrap}>
              <span className={styles.redDot}></span>
              <h2 className={styles.sectionHeading}>คำขอความช่วยเหลือด่วนในมหาลัย</h2>
            </div>
            <button
              type="button"
              className={styles.postReqMiniBtn}
              onClick={() => navigate('/create-request?target=')}
            >
              <Plus size={13} />
              <span>โพสต์คำขอ</span>
            </button>
          </div>

          <div className={styles.urgentList}>
            {filteredRequests.length === 0 ? (
              <div className={styles.urgentCard}>
                <p className={styles.urgentDetail}>
                  ยังไม่มีประกาศคำขอความช่วยเหลือในขณะนี้ กดปุ่ม "+ โพสต์คำขอ" ด้านบนเพื่อสร้างประกาศแรกได้เลย!
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isMine = Boolean(currentUser && req.requesterId === currentUser.id);
                return (
                  <div key={req.id} className={styles.urgentCard}>
                    <div className={styles.urgentHeader}>
                      <div className={styles.urgentUser}>
                        <div className={styles.initialsCircle}>{req.requesterInitials}</div>
                        <div>
                          <h4 className={styles.urgentName}>
                            {req.requesterName} • {req.requesterFaculty}
                          </h4>
                          <span className={styles.urgentTime}>{req.timeLabel || req.date}</span>
                        </div>
                      </div>
                      <span
                        className={
                          req.isUrgent ? styles.urgentBadgeRed : styles.urgentBadgeBlue
                        }
                      >
                        {req.isUrgent
                          ? 'ต้องการด่วน'
                          : req.meetingType === 'Online'
                          ? 'ออนไลน์'
                          : 'ในมหาลัย'}
                      </span>
                    </div>

                    <div className={styles.urgentSkillSwapRow}>
                      ต้องการ: {req.skillNeeded} ⇄ แลกกับ: {req.skillOffered}
                    </div>

                    <p className={styles.urgentDetail}>{req.detail}</p>

                    <div className={styles.urgentFooter}>
                      <div className={styles.urgentLocation}>
                        {req.meetingType === 'Online' ? (
                          <>
                            <Video size={14} color="var(--text-secondary)" />
                            <span>Google Meet</span>
                          </>
                        ) : (
                          <>
                            <MapPin size={14} color="var(--text-secondary)" />
                            <span>{req.location || 'ในมหาวิทยาลัย'}</span>
                          </>
                        )}
                      </div>

                      {isMine ? (
                        <button
                          type="button"
                          className={styles.myRequestPill}
                          onClick={() => navigate('/create-request')}
                        >
                          จัดการคำขอของคุณ ➔
                        </button>
                      ) : req.status === 'Pending' ? (
                        <button
                          type="button"
                          className={styles.offerSkillBtn}
                          onClick={() => handleOfferHelp(req.id)}
                        >
                          <Handshake size={14} />
                          <span>เสนอตัวช่วย (Offer Skill)</span>
                        </button>
                      ) : (
                        <span className={styles.acceptedStatusPill}>✓ {req.status}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default ExplorePage;
