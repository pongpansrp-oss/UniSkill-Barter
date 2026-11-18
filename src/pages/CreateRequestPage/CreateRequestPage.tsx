import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './CreateRequestPage.module.css';
import Header from '../../components/Header/Header';
import BottomNav from '../../components/BottomNav/BottomNav';
import {
  Send,
  Calendar,
  Video,
  MapPin,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  Phone,
  MessageSquare,
  PlusCircle,
  ListChecks,
  AlertCircle,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

function getTomorrowIsoDate(): string {
  const d = new Date(Date.now() + 86400000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

const CreateRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedTargetId = searchParams.get('target') || '';

  const {
    db,
    currentUser,
    isGuest,
    getUserById,
    createRequest,
    updateRequestStatus,
    offerHelpOnRequest,
    deleteRequest,
    renewRequest,
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'create' | 'manage'>(
    preselectedTargetId ? 'create' : 'manage'
  );
  const [manageFilter, setManageFilter] = useState<'all' | 'incoming' | 'outgoing' | 'public'>('all');

  const [targetUserId, setTargetUserId] = useState(preselectedTargetId);
  const [title, setTitle] = useState('');
  const [skillNeeded, setSkillNeeded] = useState('');
  const [skillOffered, setSkillOffered] = useState(
    currentUser?.skills?.[0]?.name || 'UX/UI Design'
  );
  const [detail, setDetail] = useState('');
  const [meetingType, setMeetingType] = useState<'Online' | 'Onsite'>('Online');
  const [date, setDate] = useState(getTomorrowIsoDate);
  const [timeLabel, setTimeLabel] = useState('14:00 - 15:30 น.');
  const [link, setLink] = useState('https://meet.google.com/use-skill-exchange');
  const [location, setLocation] = useState('หอสมุดกลาง ชั้น 3');
  const [isUrgent, setIsUrgent] = useState(false);

  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const otherStudents = db.users.filter(
    (u) => u.role === 'student' && u.id !== currentUser?.id && !u.isSuspended
  );

  const selectedTargetStudent = db.users.find((u) => u.id === targetUserId);

  // Sync skillOffered when currentUser changes
  useEffect(() => {
    if (currentUser?.skills?.[0]?.name) {
      setSkillOffered(currentUser.skills[0].name);
    }
  }, [currentUser?.id]);

  // Auto-fill skillNeeded when targetUserId is preselected or changed
  useEffect(() => {
    if (preselectedTargetId) {
      setTargetUserId(preselectedTargetId);
      setActiveTab('create');
    }
  }, [preselectedTargetId]);

  useEffect(() => {
    if (selectedTargetStudent && selectedTargetStudent.skills.length > 0) {
      setSkillNeeded(selectedTargetStudent.skills[0].name);
      if (!title) {
        setTitle(
          `ขอแลกเปลี่ยนเรียนรู้ ${selectedTargetStudent.skills[0].name} กับคุณ${selectedTargetStudent.nickname || selectedTargetStudent.name.split(' ')[0]}`
        );
      }
    }
  }, [targetUserId]);

  // All requests relevant to current user (or public requests)
  const relevantRequests = db.requests.filter((r) => {
    if (!currentUser) {
      return !r.targetUserId;
    }
    if (currentUser.role === 'admin') {
      return true;
    }
    return (
      r.requesterId === currentUser.id ||
      r.targetUserId === currentUser.id ||
      !r.targetUserId
    );
  });

  const filteredRequests = relevantRequests.filter((r) => {
    if (manageFilter === 'incoming') {
      return currentUser && r.targetUserId === currentUser.id;
    }
    if (manageFilter === 'outgoing') {
      return currentUser && r.requesterId === currentUser.id;
    }
    if (manageFilter === 'public') {
      return !r.targetUserId;
    }
    return true;
  });

  const incomingPendingCount = currentUser
    ? db.requests.filter((r) => r.targetUserId === currentUser.id && r.status === 'Pending').length
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const targetStu = db.users.find((u) => u.id === targetUserId);

    const res = await createRequest({
      targetUserId: targetUserId || undefined,
      targetUserName: targetStu?.name,
      targetUserAvatar: targetStu?.picture,
      title: title.trim(),
      skillNeeded: skillNeeded.trim(),
      skillOffered: skillOffered.trim(),
      detail: detail.trim(),
      meetingType,
      date,
      timeLabel,
      link: meetingType === 'Online' ? link.trim() : undefined,
      location: meetingType === 'Onsite' ? location.trim() : undefined,
      isUrgent,
    });

    if (!res.ok) {
      setMsg({ type: 'error', text: res.message || 'ไม่สามารถส่งคำขอได้' });
      return;
    }

    setTitle('');
    setSkillNeeded('');
    setDetail('');
    setMsg({
      type: 'success',
      text: targetStu
        ? `ส่งคำขอแลกเปลี่ยนทักษะถึง "${targetStu.name}" สำเร็จแล้ว! อีกฝ่ายจะเห็นคำขอนี้ในแท็บ "ส่งถึงฉัน" ทันที`
        : 'โพสต์คำขอความช่วยเหลือสาธารณะลงบอร์ดมหาวิทยาลัยเรียบร้อยแล้ว!',
    });
    setManageFilter(targetStu ? 'outgoing' : 'all');
    setActiveTab('manage');
  };

  const handleStatusChange = async (
    reqId: string,
    newStatus: 'Accepted' | 'Rejected' | 'Completed'
  ) => {
    const res = await updateRequestStatus(reqId, newStatus);
    if (!res.ok) {
      setMsg({ type: 'error', text: res.message || 'ไม่สามารถอัปเดตสถานะได้' });
      return;
    }
    setMsg({
      type: 'success',
      text:
        newStatus === 'Accepted'
          ? 'ยอมรับคำขอแล้ว! ระบบได้ปลดล็อกช่องทางติดต่อส่วนตัว (Contact) และลิงก์นัดหมายเรียบร้อย'
          : newStatus === 'Completed'
          ? 'แลกเปลี่ยนทักษะสำเร็จ (Completed)! ทั้งสองฝ่ายได้รับ +80 XP และสามารถเขียนรีวิวให้กันได้แล้ว'
          : 'ปฏิเสธคำขอเรียบร้อยแล้ว',
    });
  };

  const handleOfferHelp = async (reqId: string) => {
    const res = await offerHelpOnRequest(reqId);
    if (!res.ok) {
      setMsg({ type: 'error', text: res.message || 'ไม่สามารถรับคำขอได้' });
      return;
    }
    setMsg({
      type: 'success',
      text: 'คุณอาสาเข้าช่วยเหลือคำขอนี้แล้ว! ระบบปลดล็อกช่องทางติดต่อและลิงก์นัดหมายให้ทั้งสองฝ่ายเรียบร้อย',
    });
  };

  const handleDeleteRequest = async (reqId: string) => {
    const res = await deleteRequest(reqId);
    if (!res.ok) {
      setMsg({ type: 'error', text: res.message || 'ไม่สามารถยกเลิกคำขอได้' });
      return;
    }
    setMsg({ type: 'success', text: res.message || 'ยกเลิกและลบคำขอเรียบร้อยแล้ว' });
  };

  const handleRenewRequest = async (reqId: string) => {
    const res = await renewRequest(reqId);
    if (!res.ok) {
      setMsg({ type: 'error', text: res.message || 'ไม่สามารถต่ออายุคำขอได้' });
      return;
    }
    setMsg({ type: 'success', text: res.message || 'ต่ออายุคำขอเรียบร้อยแล้ว' });
  };

  return (
    <div className={styles.page}>
      <Header title="Requests" showBack />

      <main className={styles.mainContent}>
        {/* Mode Switcher */}
        <div className={styles.tabBar}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'manage' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <ListChecks size={16} />
            <span>
              รายการคำขอ ({relevantRequests.length})
              {incomingPendingCount > 0 ? ` • รอตอบรับ ${incomingPendingCount}` : ''}
            </span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'create' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('create')}
          >
            <PlusCircle size={16} />
            <span>สร้างคำขอความช่วยเหลือ</span>
          </button>
        </div>

        {msg && (
          <div
            className={`${styles.alertBox} ${
              msg.type === 'error' ? styles.alertError : styles.alertSuccess
            }`}
          >
            <span>{msg.text}</span>
            <button type="button" onClick={() => setMsg(null)}>
              ✕
            </button>
          </div>
        )}

        {activeTab === 'create' ? (
          <form className={styles.formCard} onSubmit={handleSubmit}>
            <h2 className={styles.cardHeading}>สร้างคำขอแลกเปลี่ยนทักษะ (Request)</h2>
            <p className={styles.cardSub}>
              ระบุทักษะที่คุณต้องการให้เพื่อนช่วย และทักษะที่คุณพร้อมแลกเปลี่ยนกลับไป
            </p>

            {isGuest && (
              <div className={styles.guestWarning}>
                <AlertCircle size={16} />
                <span>
                  สิทธิ์ของ Guest ไม่สามารถกดส่งคำขอความช่วยเหลือได้ กรุณาเข้าสู่ระบบนักศึกษาก่อน
                </span>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>ส่งคำขอถึงนักศึกษา (หรือเว้นว่างเพื่อโพสต์สาธารณะ)</label>
              <select
                className={styles.selectInput}
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
              >
                <option value="">🌐 โพสต์คำขอสาธารณะในมหาวิทยาลัย (ทุกคนเห็นได้)</option>
                {otherStudents.map((stu) => (
                  <option key={stu.id} value={stu.id}>
                    👤 {stu.name} ({stu.faculty} • ถนัด{' '}
                    {stu.skills.map((s) => s.name).join(', ')})
                  </option>
                ))}
              </select>
            </div>

            {selectedTargetStudent && (
              <div className={styles.targetPreviewBox}>
                <div className={styles.targetPreviewLeft}>
                  <img
                    src={selectedTargetStudent.picture}
                    alt={selectedTargetStudent.name}
                    className={styles.targetPreviewAvatar}
                  />
                  <div>
                    <div className={styles.targetPreviewName}>
                      ส่งคำขอตรงถึง: {selectedTargetStudent.name}
                    </div>
                    <div className={styles.targetPreviewSub}>
                      🎯 กำลังอยากเรียน: {selectedTargetStudent.skillWanted || 'ทุกทักษะ'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.secondaryActionBtn}
                  onClick={() => navigate(`/student/${selectedTargetStudent.id}`)}
                >
                  <ExternalLink size={12} />
                  <span>ดูโปรไฟล์</span>
                </button>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>หัวข้อคำขอ (Request Title) *</label>
              <input
                type="text"
                className={styles.textInput}
                placeholder="เช่น ขอคนช่วยตรวจสูตร Excel ทำ Dashboard การตลาด"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>ทักษะที่ต้องการให้ช่วย (Skill Needed) *</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="เช่น Python, SPSS, 3D"
                  value={skillNeeded}
                  onChange={(e) => setSkillNeeded(e.target.value)}
                  required
                />
                {selectedTargetStudent && selectedTargetStudent.skills.length > 0 && (
                  <div className={styles.skillChipGroup}>
                    {selectedTargetStudent.skills.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        className={`${styles.skillQuickChip} ${
                          skillNeeded === s.name ? styles.skillQuickChipActive : ''
                        }`}
                        onClick={() => setSkillNeeded(s.name)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>ทักษะที่แลกเปลี่ยน *</label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="เช่น UX/UI Figma"
                  value={skillOffered}
                  onChange={(e) => setSkillOffered(e.target.value)}
                  required
                />
                {currentUser && currentUser.skills.length > 0 && (
                  <div className={styles.skillChipGroup}>
                    {currentUser.skills.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        className={`${styles.skillQuickChip} ${
                          skillOffered === s.name ? styles.skillQuickChipActive : ''
                        }`}
                        onClick={() => setSkillOffered(s.name)}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>รายละเอียดคำขอ (Detail) *</label>
              <textarea
                className={styles.textareaInput}
                rows={3}
                placeholder="อธิบายขอบเขตงานหรือหัวข้อที่ต้องการให้เพื่อนช่วยสอน..."
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                required
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>รูปแบบการนัดหมาย (Meeting) *</label>
              <div className={styles.meetingToggle}>
                <button
                  type="button"
                  className={`${styles.meetingBtn} ${
                    meetingType === 'Online' ? styles.meetingBtnActive : ''
                  }`}
                  onClick={() => setMeetingType('Online')}
                >
                  <Video size={15} />
                  <span>Online</span>
                </button>
                <button
                  type="button"
                  className={`${styles.meetingBtn} ${
                    meetingType === 'Onsite' ? styles.meetingBtnActive : ''
                  }`}
                  onClick={() => setMeetingType('Onsite')}
                >
                  <MapPin size={15} />
                  <span>Onsite (ในมหาลัย)</span>
                </button>
              </div>
            </div>

            <div className={styles.twoCol}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <Calendar size={13} /> วันที่นัดหมาย (Date) *
                </label>
                <input
                  type="date"
                  className={styles.textInput}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <Clock size={13} /> ช่วงเวลา
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="เช่น 14:00 - 15:30 น."
                  value={timeLabel}
                  onChange={(e) => setTimeLabel(e.target.value)}
                />
              </div>
            </div>

            {meetingType === 'Online' ? (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <LinkIcon size={13} /> ลิงก์สำหรับ Online (จะแสดงเมื่อ Accepted เท่านั้น)
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="https://meet.google.com/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                />
              </div>
            ) : (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  <MapPin size={13} /> สถานที่นัดหมาย Onsite
                </label>
                <input
                  type="text"
                  className={styles.textInput}
                  placeholder="เช่น หอสมุดกลาง ชั้น 3"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}

            <label className={styles.urgentCheck}>
              <input
                type="checkbox"
                checked={isUrgent}
                onChange={(e) => setIsUrgent(e.target.checked)}
              />
              <span>ติดป้าย "ต้องการด่วน" ในหน้า Explore ของมหาวิทยาลัย</span>
            </label>

            <button type="submit" className={styles.submitRequestBtn}>
              <Send size={16} />
              <span>ส่งคำขอแลกเปลี่ยนทักษะ (บันทึกลง JSON)</span>
            </button>
          </form>
        ) : (
          <div className={styles.requestsList}>
            {/* Sub-filter bar */}
            <div className={styles.subFilterRow}>
              <button
                type="button"
                className={`${styles.subFilterChip} ${
                  manageFilter === 'all' ? styles.subFilterChipActive : ''
                }`}
                onClick={() => setManageFilter('all')}
              >
                ทั้งหมด ({relevantRequests.length})
              </button>
              <button
                type="button"
                className={`${styles.subFilterChip} ${
                  manageFilter === 'incoming' ? styles.subFilterChipActive : ''
                }`}
                onClick={() => setManageFilter('incoming')}
              >
                📥 ส่งถึงฉัน (
                {currentUser
                  ? relevantRequests.filter((r) => r.targetUserId === currentUser.id).length
                  : 0}
                )
              </button>
              <button
                type="button"
                className={`${styles.subFilterChip} ${
                  manageFilter === 'outgoing' ? styles.subFilterChipActive : ''
                }`}
                onClick={() => setManageFilter('outgoing')}
              >
                📤 ที่ฉันสร้าง (
                {currentUser
                  ? relevantRequests.filter((r) => r.requesterId === currentUser.id).length
                  : 0}
                )
              </button>
              <button
                type="button"
                className={`${styles.subFilterChip} ${
                  manageFilter === 'public' ? styles.subFilterChipActive : ''
                }`}
                onClick={() => setManageFilter('public')}
              >
                🌐 สาธารณะ ({relevantRequests.filter((r) => !r.targetUserId).length})
              </button>
            </div>

            {filteredRequests.length === 0 ? (
              <div className={styles.emptyReqBox}>
                <h3 className={styles.emptyReqTitle}>ยังไม่มีรายการคำขอในหมวดหมู่นี้</h3>
                <p className={styles.emptyReqSub}>
                  คุณสามารถสร้างคำขอความช่วยเหลือใหม่ หรือเลือกดูคำขอในหมวดหมู่อื่นได้
                </p>
                <button
                  type="button"
                  className={styles.acceptBtn}
                  onClick={() => setActiveTab('create')}
                >
                  <PlusCircle size={15} />
                  <span>สร้างคำขอแลกเปลี่ยนใหม่</span>
                </button>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isRequester = currentUser?.id === req.requesterId;
                const isTarget = currentUser?.id === req.targetUserId;
                const isParticipant = isRequester || isTarget;

                const partnerId = isRequester ? req.targetUserId : req.requesterId;
                const partnerUser = partnerId ? getUserById(partnerId) : undefined;

                const isUnlocked =
                  !isGuest &&
                  currentUser &&
                  (isParticipant || currentUser.role === 'admin') &&
                  (req.status === 'Accepted' || req.status === 'Completed');

                const alreadyReviewed = Boolean(
                  currentUser &&
                    ((isRequester && req.reviewedByRequester) ||
                      (isTarget && req.reviewedByTarget) ||
                      db.reviews.some(
                        (rv) => rv.requestId === req.id && rv.reviewerId === currentUser.id
                      ))
                );

                return (
                  <div key={req.id} className={styles.reqCard}>
                    <div className={styles.reqTopRow}>
                      <div>
                        <div className={styles.reqTagRow}>
                          <span className={styles.reqSkillTag}>
                            ต้องการ: {req.skillNeeded} ⇄ แลกกับ: {req.skillOffered}
                          </span>
                          {req.isUrgent && (
                            <span className={styles.urgentMiniPill}>ด่วน</span>
                          )}
                          {isTarget && (
                            <span className={styles.publicMiniPill}>📥 ส่งถึงคุณโดยตรง</span>
                          )}
                          {isRequester && req.targetUserId && (
                            <span className={styles.publicMiniPill}>📤 คำขอที่ส่งออก</span>
                          )}
                          {!req.targetUserId && (
                            <span className={styles.publicMiniPill}>🌐 สาธารณะ</span>
                          )}
                        </div>
                        <h3 className={styles.reqTitle}>{req.title}</h3>
                      </div>
                      <span className={`${styles.statusBadge} ${styles[`status${req.status}`]}`}>
                        {req.status}
                      </span>
                    </div>

                    <p className={styles.reqDetail}>{req.detail}</p>

                    <div className={styles.reqMetaRow}>
                      <span>
                        ผู้ขอ:{' '}
                        {getUserById(req.requesterId) ? (
                          <button
                            type="button"
                            className={styles.userLinkBtn}
                            onClick={() => navigate(`/student/${req.requesterId}`)}
                          >
                            {req.requesterName}
                          </button>
                        ) : (
                          <strong>{req.requesterName} ({req.requesterFaculty})</strong>
                        )}
                      </span>
                      {req.targetUserName && req.targetUserId && (
                        <span>
                          • ผู้ช่วย:{' '}
                          <button
                            type="button"
                            className={styles.userLinkBtn}
                            onClick={() => navigate(`/student/${req.targetUserId}`)}
                          >
                            {req.targetUserName}
                          </button>
                        </span>
                      )}
                      <span>
                        • นัดหมาย: {req.meetingType} ({req.date}
                        {req.timeLabel ? ` • ${req.timeLabel}` : ''})
                      </span>
                    </div>

                    {/* Unlocked Contact & Meeting Info when Accepted or Completed */}
                    {isUnlocked && (
                      <div className={styles.unlockedContactBox}>
                        <div className={styles.unlockedTitle}>
                          🔓 ข้อมูลการติดต่อและนัดหมาย (เปิดเผยเนื่องจากสถานะ {req.status})
                        </div>
                        {req.meetingType === 'Online' && req.link && (
                          <div className={styles.unlockedItem}>
                            <Video size={14} color="var(--primary)" />
                            <span>ลิงก์ประชุมออนไลน์: </span>
                            <a href={req.link} target="_blank" rel="noreferrer">
                              {req.link}
                            </a>
                          </div>
                        )}
                        {req.meetingType === 'Onsite' && req.location && (
                          <div className={styles.unlockedItem}>
                            <MapPin size={14} color="var(--primary)" />
                            <span>สถานที่นัดพบ: {req.location}</span>
                          </div>
                        )}
                        {partnerUser && (
                          <div className={styles.partnerContacts}>
                            <span>
                              <Phone size={12} /> {partnerUser.contact.phone}
                            </span>
                            <span>
                              <MessageSquare size={12} /> LINE: {partnerUser.contact.lineId}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons based on Request Status */}
                    {!isGuest && currentUser && (
                      <div className={styles.reqActions}>
                        {/* Target user or public helper can accept Pending requests */}
                        {req.status === 'Pending' &&
                          req.requesterId !== currentUser.id &&
                          (!req.targetUserId || req.targetUserId === currentUser.id) && (
                            <>
                              <button
                                type="button"
                                className={styles.acceptBtn}
                                onClick={() =>
                                  req.targetUserId
                                    ? handleStatusChange(req.id, 'Accepted')
                                    : handleOfferHelp(req.id)
                                }
                              >
                                <CheckCircle2 size={15} />
                                <span>
                                  {req.targetUserId
                                    ? 'ยอมรับคำขอ (Accept)'
                                    : 'อาสาช่วยคำขอนี้ (Accept)'}
                                </span>
                              </button>
                              {req.targetUserId === currentUser.id && (
                                <button
                                  type="button"
                                  className={styles.rejectBtn}
                                  onClick={() => handleStatusChange(req.id, 'Rejected')}
                                >
                                  <XCircle size={15} />
                                  <span>ปฏิเสธ</span>
                                </button>
                              )}
                            </>
                          )}

                        {/* Requester can cancel/delete their own Pending request */}
                        {req.status === 'Pending' && isRequester && (
                          <button
                            type="button"
                            className={styles.rejectBtn}
                            onClick={() => handleDeleteRequest(req.id)}
                          >
                            <Trash2 size={14} />
                            <span>ยกเลิกคำขอ</span>
                          </button>
                        )}

                        {/* Requester can renew Expired or Rejected requests */}
                        {(req.status === 'Expired' || req.status === 'Rejected') &&
                          isRequester && (
                            <>
                              <button
                                type="button"
                                className={styles.secondaryActionBtn}
                                onClick={() => handleRenewRequest(req.id)}
                              >
                                <RefreshCw size={13} />
                                <span>ต่ออายุคำขอ (+7 วัน)</span>
                              </button>
                              <button
                                type="button"
                                className={styles.rejectBtn}
                                onClick={() => handleDeleteRequest(req.id)}
                              >
                                <Trash2 size={13} />
                                <span>ลบคำขอ</span>
                              </button>
                            </>
                          )}

                        {/* Only participants can mark Accepted -> Completed */}
                        {req.status === 'Accepted' && isParticipant && (
                          <button
                            type="button"
                            className={styles.completeBtn}
                            onClick={() => handleStatusChange(req.id, 'Completed')}
                          >
                            <CheckCircle2 size={15} />
                            <span>ยืนยันแลกเปลี่ยนสำเร็จ (Mark Completed +80 XP)</span>
                          </button>
                        )}

                        {/* Completed: Review button or Reviewed badge */}
                        {req.status === 'Completed' && isParticipant && partnerId && (
                          <>
                            {alreadyReviewed ? (
                              <span className={styles.reviewedDoneBadge}>
                                <CheckCircle2 size={14} />
                                <span>ให้คะแนนรีวิวแล้ว</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                className={styles.reviewNowBtn}
                                onClick={() =>
                                  navigate(
                                    `/student/${partnerId}?review=true&requestId=${req.id}&skill=${encodeURIComponent(
                                      isRequester ? req.skillNeeded : req.skillOffered
                                    )}`
                                  )
                                }
                              >
                                <Star size={15} />
                                <span>ให้คะแนนและเขียนรีวิว (+15 XP)</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateRequestPage;
