export interface JwtPayload {
  sub: number;        // شناسه کاربر (subject)
  roleId: number;     // شناسه نقش
  role?: string;      // نام نقش (اختیاری)
  iat?: number;       // زمان ایجاد (اختیاری - توسط JWT اضافه می‌شه)
  exp?: number;       // زمان انقضا (اختیاری - توسط JWT اضافه می‌شه)
}