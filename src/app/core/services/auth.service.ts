import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { Member } from '../models';

// ─── Dummy member registry (replace with API calls later) ────────────────────
const MEMBERS: Member[] = [
  { code: 'NAJUS-001', name: 'Rupali Handicrafts',  email: 'rupali@example.com',     vendorId: 'v1', role: 'vendor' },
  { code: 'NAJUS-002', name: 'Sylhet Tea Garden',   email: 'sylhettea@example.com',  vendorId: 'v2', role: 'vendor' },
  { code: 'NAJUS-003', name: 'Dhaka Muslin House',  email: 'dml@example.com',        vendorId: 'v3', role: 'vendor' },
  { code: 'NAJUS-004', name: 'Green Earth Organics',email: 'geo@example.com',        vendorId: 'v4', role: 'vendor' },
  { code: 'NAJUS-005', name: 'Nakshi Collective',   email: 'nakshi@example.com',     vendorId: 'v5', role: 'vendor' },
];

// Demo OTP — replace with real OTP verification later
const DEMO_OTP = '123456';
const STORAGE_KEY = 'najus_member';

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ── State ────────────────────────────────────────────────────────────────
  currentMember = signal<Member | null>(this.loadStoredMember());
  isAuthenticated = computed(() => !!this.currentMember());

  // ── OTP flow ─────────────────────────────────────────────────────────────

  /**
   * Step 1 — Validate membership code and trigger OTP email.
   * Returns masked email on success; throws with user-friendly message on failure.
   * TODO: Replace with POST /api/auth/request-otp
   */
  requestOtp(memberCode: string): Observable<{ maskedEmail: string }> {
    const member = this.findMember(memberCode);
    if (!member) {
      return throwError(() => new Error(
        'Membership code not found. Please check and try again.'
      )).pipe(delay(800));
    }
    return of({ maskedEmail: this.maskEmail(member.email) }).pipe(delay(1200));
  }

  /**
   * Step 2 — Verify the OTP and create a session.
   * Returns the authenticated Member on success.
   * TODO: Replace with POST /api/auth/verify-otp
   */
  verifyOtp(memberCode: string, otp: string): Observable<Member> {
    const member = this.findMember(memberCode);
    if (!member) {
      return throwError(() => new Error('Session expired. Please start over.')).pipe(delay(500));
    }
    if (otp !== DEMO_OTP) {
      return throwError(() => new Error(
        'Invalid or expired OTP. Please check your email and try again.'
      )).pipe(delay(900));
    }
    this.setSession(member);
    return of(member).pipe(delay(900));
  }

  logout(): void {
    this.currentMember.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  private findMember(code: string): Member | undefined {
    return MEMBERS.find(m => m.code === code.trim().toUpperCase());
  }

  private setSession(member: Member): void {
    this.currentMember.set(member);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(member));
  }

  private loadStoredMember(): Member | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Member) : null;
    } catch {
      return null;
    }
  }

  maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    const visible = user.slice(0, 2);
    return `${visible}${'*'.repeat(Math.max(3, user.length - 2))}@${domain}`;
  }
}
