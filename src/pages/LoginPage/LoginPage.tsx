import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './LoginPage.module.css';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Mail,
  Lock,
  ShieldCheck,
  Info,
  IdCard,
  ArrowRight,
  KeyRound,
  ArrowLeft,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useDatabase } from '../../context/DatabaseContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    login,
    resetPassword,
    loginAsGuest,
    logout,
    currentUser,
    rememberedEmail,
  } = useDatabase();

  const [activeTab, setActiveTab] = useState<'student' | 'guest'>('student');
  const [isResetMode, setIsResetMode] = useState(false);

  // Login form state (starts empty unless user previously opted into Remember Email)
  const [email, setEmail] = useState(rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset Password form state
  const [resetEmail, setResetEmail] = useState('');
  const [verifyIdentity, setVerifyIdentity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const redirectPath = (location.state as { from?: string } | null)?.from;

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    // Brief realistic verification delay
    await new Promise((r) => setTimeout(r, 250));

    const res = login(email, password, rememberMe);
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.message || 'ไม่สามารถเข้าสู่ระบบได้ กรุณาตรวจสอบอีเมลและรหัสผ่าน');
      return;
    }

    if (redirectPath && redirectPath !== '/') {
      navigate(redirectPath, { replace: true });
    } else if (res.user?.role === 'admin') {
      navigate('/admin', { replace: true });
    } else {
      navigate('/explore', { replace: true });
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmNewPassword) {
      setErrorMsg('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    const res = await resetPassword({
      email: resetEmail,
      verifyIdentity,
      newPassword,
    });
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.message || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้');
      return;
    }

    setEmail(resetEmail.trim());
    setPassword('');
    setResetEmail('');
    setVerifyIdentity('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsResetMode(false);
    setSuccessMsg(
      res.message || 'ตั้งรหัสผ่านใหม่สำเร็จ! กรุณากรอกรหัสผ่านใหม่เพื่อเข้าสู่ระบบ'
    );
  };

  const handleGuestEnter = () => {
    loginAsGuest();
    navigate('/explore');
  };

  return (
    <div className={styles.page}>
      <div className={styles.topLogoOuter}>
        <div className={styles.topLogoInner}>
          <GraduationCap size={22} color="var(--primary)" />
          <div className={styles.topLogoText}>
            <span>UNIVERSITY SKILL</span>
            <span>EXCHANGE [USE]</span>
          </div>
        </div>
      </div>

      <h1 className={styles.title}>
        University Skill Exchange <span className={styles.brandHighlight}>[USE]</span>
      </h1>
      <p className={styles.subtitle}>แพลตฟอร์มแลกเปลี่ยนทักษะสำหรับเพื่อนนักศึกษา</p>

      {/* Active Session Banner if already logged in */}
      {currentUser && (
        <div className={styles.continueSessionCard}>
          <div className={styles.continueUserLeft}>
            <img
              src={currentUser.picture}
              alt={currentUser.name}
              className={styles.continueAvatar}
            />
            <div className={styles.continueTextWrap}>
              <span className={styles.continueLabel}>กำลังอยู่ในระบบ</span>
              <span className={styles.continueName}>
                {currentUser.name} ({currentUser.role === 'admin' ? 'Admin' : currentUser.faculty})
              </span>
            </div>
          </div>
          <div className={styles.continueActions}>
            <button
              type="button"
              className={styles.continueBtn}
              onClick={() =>
                navigate(currentUser.role === 'admin' ? '/admin' : '/explore')
              }
            >
              <span>เข้าใช้งานต่อ</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              className={styles.logoutSessionBtn}
              onClick={() => {
                logout();
                setSuccessMsg('ออกจากระบบเรียบร้อยแล้ว');
              }}
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}

      {/* Role Segmented Control */}
      <div className={styles.segmentedControl}>
        <button
          type="button"
          className={`${styles.segmentBtn} ${activeTab === 'student' ? styles.segmentActive : ''}`}
          onClick={() => {
            setActiveTab('student');
            setErrorMsg('');
          }}
        >
          <GraduationCap size={17} />
          <span>นักศึกษา (Student)</span>
        </button>
        <button
          type="button"
          className={`${styles.segmentBtn} ${activeTab === 'guest' ? styles.segmentActive : ''}`}
          onClick={() => {
            setActiveTab('guest');
            setIsResetMode(false);
            setErrorMsg('');
          }}
        >
          <Eye size={17} />
          <span>เข้าชมแบบ Guest</span>
        </button>
      </div>

      {activeTab === 'student' ? (
        isResetMode ? (
          <form className={styles.resetCard} onSubmit={handleResetPasswordSubmit}>
            <div className={styles.resetHeader}>
              <h3 className={styles.resetTitle}>
                <KeyRound size={17} color="var(--primary)" />
                <span>ตั้งรหัสผ่านใหม่ (Reset Password)</span>
              </h3>
              <button
                type="button"
                className={styles.backToLoginBtn}
                onClick={() => {
                  setIsResetMode(false);
                  setErrorMsg('');
                }}
              >
                <ArrowLeft size={14} />
                <span>กลับหน้าล็อกอิน</span>
              </button>
            </div>
            <p className={styles.resetSub}>
              กรุณายืนยันตัวตนด้วยอีเมลมหาวิทยาลัย และเบอร์โทรศัพท์ (หรือ LINE ID)
              ที่คุณใช้ลงทะเบียนไว้เพื่อกำหนดรหัสผ่านใหม่
            </p>

            {errorMsg && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Mail size={14} className={styles.labelIcon} />
                <span>อีเมลมหาวิทยาลัยที่ลงทะเบียน *</span>
              </label>
              <div className={styles.inputBox}>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="กรอกอีเมลของคุณ เช่น name@spumail.net"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Phone size={14} className={styles.labelIcon} />
                <span>ยืนยันตัวตน: เบอร์โทรศัพท์ หรือ LINE ID ที่ผูกกับบัญชี *</span>
              </label>
              <div className={styles.inputBox}>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="เช่น เบอร์โทรศัพท์ 10 หลัก, เลขท้าย 4 ตัว หรือ LINE ID"
                  value={verifyIdentity}
                  onChange={(e) => setVerifyIdentity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Lock size={14} className={styles.labelIcon} />
                <span>รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร) *</span>
              </label>
              <div className={styles.inputBox}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="ตั้งรหัสผ่านใหม่ของคุณ"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowNewPassword((prev) => !prev)}
                >
                  {showNewPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>
                <Lock size={14} className={styles.labelIcon} />
                <span>ยืนยันรหัสผ่านใหม่อีกครั้ง *</span>
              </label>
              <div className={styles.inputBox}>
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  minLength={6}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className={styles.loginSubmitBtn}
              disabled={isSubmitting}
            >
              <span>
                {isSubmitting ? 'กำลังบันทึกรหัสผ่านใหม่...' : 'ยืนยันการเปลี่ยนรหัสผ่าน'}
              </span>
              <ArrowRight size={17} />
            </button>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleStudentLogin}>
            {errorMsg && (
              <div className={styles.errorAlert}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className={styles.successAlert}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>
                  <Mail size={15} className={styles.labelIcon} />
                  <span>อีเมลมหาวิทยาลัย</span>
                </label>
                <span className={styles.domainHint}>@university.ac.th / @spumail.net</span>
              </div>

              <div className={styles.inputBox}>
                <input
                  type="email"
                  className={styles.input}
                  placeholder="กรอกอีเมลนักศึกษาของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
                <ShieldCheck size={18} className={styles.inputRightIcon} />
              </div>

              <div className={styles.helperRow}>
                <Info size={13} />
                <span>ใช้อีเมลสถาบันที่ได้ลงทะเบียนไว้เพื่อเข้าสู่ระบบ</span>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.labelRow}>
                <label className={styles.label}>
                  <Lock size={15} className={styles.labelIcon} />
                  <span>รหัสผ่าน</span>
                </label>
                <button
                  type="button"
                  className={styles.forgotLink}
                  onClick={() => {
                    setResetEmail(email);
                    setErrorMsg('');
                    setSuccessMsg('');
                    setIsResetMode(true);
                  }}
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              <div className={styles.inputBox}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.input}
                  placeholder="กรอกรหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className={styles.eyeButton}
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label="แสดงหรือซ่อนรหัสผ่าน"
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
            </div>

            <div className={styles.rememberRow}>
              <label className={styles.rememberCheckLabel}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>จดจำการเข้าสู่ระบบในอุปกรณ์นี้</span>
              </label>
            </div>

            <button
              type="submit"
              className={styles.loginSubmitBtn}
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? 'กำลังตรวจสอบข้อมูล...' : 'เข้าสู่ระบบนักศึกษา'}</span>
              <ArrowRight size={17} />
            </button>
          </form>
        )
      ) : (
        <div className={styles.guestBox}>
          <p className={styles.guestDesc}>
            ในโหมด <strong>Guest (ผู้เยี่ยมชม)</strong> คุณสามารถค้นหาทักษะ ดูโปรไฟล์นักศึกษา และอ่านรีวิวได้ทั้งหมด
            แต่จะไม่สามารถกดส่งคำขอความช่วยเหลือ (Request) หรือดูช่องทางการติดต่อส่วนตัวได้
          </p>
          <button type="button" className={styles.loginSubmitBtn} onClick={handleGuestEnter}>
            <span>เข้าชมแพลตฟอร์มแบบ Guest</span>
            <ArrowRight size={17} />
          </button>
        </div>
      )}

      <div className={styles.dividerRow}>
        <div className={styles.dividerLine}></div>
        <span className={styles.dividerText}>หรือสร้างบัญชีนักศึกษาใหม่</span>
        <div className={styles.dividerLine}></div>
      </div>

      {/* Bottom Signup Card */}
      <div className={styles.registerCard}>
        <div className={styles.registerBadge}>
          <IdCard size={20} color="var(--primary)" />
        </div>
        <h3 className={styles.registerTitle}>ยังไม่มีบัญชีนักศึกษา?</h3>
        <p className={styles.registerSubtitle}>
          เริ่มแลกเปลี่ยนทักษะภาษา เขียนโปรแกรม หรือติววิชาการ
        </p>
        <button
          type="button"
          className={styles.registerBtn}
          onClick={() => navigate('/create-profile')}
        >
          สมัครสมาชิกและยืนยันตัวตนนักศึกษา
        </button>
      </div>

      <div className={styles.footerNote}>
        <span className={styles.purpleDot}></span>
        <span>ปลอดภัยด้วยการยืนยันตัวตนนักศึกษา 100%</span>
      </div>
    </div>
  );
};

export default LoginPage;
