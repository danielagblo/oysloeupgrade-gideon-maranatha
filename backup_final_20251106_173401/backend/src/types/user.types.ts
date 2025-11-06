export interface User {
  id: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  googleId?: string;
  name: string;
  address?: string;
  avatar?: string;
  referralCode?: string;
  referralPoints: number;
  level: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  preferredNotificationEmail?: string;
  preferredNotificationPhone?: string;
  createdFromApp: boolean;
  deleted: boolean;
  deletedAt?: Date;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  products?: unknown[];
  reviews?: unknown[];
  chatroomMembers?: unknown[];
  messages?: unknown[];
  referralsGiven?: unknown[];
  referralsReceived?: unknown[];
  referralRedemptions?: unknown[];
  fcmDevices?: unknown[];
  couponRedemptions?: unknown[];
  wallet?: {
    id: string;
    balance: number;
    ledger?: unknown[];
  };
}
