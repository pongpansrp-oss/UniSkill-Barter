export type UserRole = 'student' | 'admin' | 'guest';

export interface SkillItem {
  name: string;
  level: string; // e.g. 'Advanced', 'Intermediate', 'Beginner', 'Lv.3', 'Lv.4', 'Lv.5'
  category?: 'coding' | 'design' | 'language' | 'music' | 'academic';
}

export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  tag: string;
  imageUrl?: string;
  url?: string;
}

export interface ContactInfo {
  phone: string;
  email: string;
  lineId: string;
  facebook?: string;
}

export interface User {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  password?: string;
  role: UserRole;
  university: string;
  faculty: string;
  major: string;
  year: string;
  picture: string;
  studentCardImage?: string;
  isVerified: boolean;
  verifiedDomain?: string;
  badgeText?: string; // e.g., 'Top Rated', 'ตอบกลับใน 15 นาที', 'Verified'
  badgeType?: 'top' | 'fast' | 'verified';
  xp: number;
  levelTitle: string;
  exchangeCount: number;
  responseTime: string;
  isAvailable: boolean;
  skills: SkillItem[];
  skillWanted?: string;
  portfolioItems: PortfolioItem[];
  portfolioLinks: {
    githubOrWebsite?: string;
    googleDrive?: string;
    dribbble?: string;
  };
  contact: ContactInfo;
  reportCount: number;
  isSuspended: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  requestId?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerFaculty: string;
  reviewerAvatar: string;
  targetUserId: string;
  rate: number; // 1.0 - 5.0 (supports decimals)
  comment: string;
  skillExchanged: string;
  createdAt: string;
  timeAgo?: string;
}

export type RequestStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Expired';

export interface HelpRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterInitials: string;
  requesterFaculty: string;
  requesterAvatar?: string;
  targetUserId?: string; // Optional if open public request in university, or specific student ID
  targetUserName?: string;
  targetUserAvatar?: string;
  title: string; // หัวข้อคำขอ
  skillNeeded: string; // ทักษะที่ต้องการให้ช่วย
  skillOffered: string; // ทักษะที่พร้อมแลกเปลี่ยน
  detail: string; // รายละเอียดคำขอ
  meetingType: 'Online' | 'Onsite';
  location?: string; // สำหรับ Onsite เช่น หอสมุดกลาง ชั้น 3
  date: string; // YYYY-MM-DD
  timeLabel?: string; // เช่น ส่งงานพรุ่งนี้ 18:00 น. / นัดวันศุกร์นี้
  link?: string; // สำหรับ Online เช่น Google Meet
  isUrgent?: boolean;
  status: RequestStatus;
  createdAt: string; // ISO timestamp
  reviewedByRequester?: boolean;
  reviewedByTarget?: boolean;
}

export interface UserReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetUserId: string;
  targetUserName: string;
  reason: string;
  detail: string;
  createdAt: string;
  status: 'Pending' | 'Resolved';
}

export interface SystemAnnouncement {
  text: string;
  active: boolean;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  reviews: Review[];
  requests: HelpRequest[];
  reports: UserReport[];
  announcement?: SystemAnnouncement;
}

