import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { Member } from '../models';
import { environment } from '../../../environments/environment';

const TOKEN_KEY  = 'najus_token';
const MEMBER_KEY = 'najus_member';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.api;

  // ── State ────────────────────────────────────────────────────────────────
  authToken       = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  currentMember   = signal<Member | null>(this.loadStoredMember());
  isAuthenticated = computed(() => !!this.authToken());

  // ── OTP flow ─────────────────────────────────────────────────────────────

  /**
   * Step 1 — Validate membership code and trigger OTP email.
   * Returns masked email on success.
   */
  requestOtp(memberCode: string): Observable<{ maskedEmail: string }> {
    return this.http.post<{ maskedEmail: string }>(
      `${this.base}/auth/request-otp`,
      { member_code: memberCode.trim().toUpperCase() },
    ).pipe(
      catchError(err => throwError(() => new Error(
        err.error?.message ?? 'Membership code not found. Please check and try again.'
      ))),
    );
  }

  /**
   * Step 2 — Verify the OTP and create a session.
   * Returns the authenticated Member on success.
   */
  verifyOtp(memberCode: string, otp: string): Observable<Member> {
    return this.http.post<{ member: Member; token: string }>(
      `${this.base}/auth/verify-otp`,
      { member_code: memberCode.trim().toUpperCase(), otp },
    ).pipe(
      map(res => {
        this.setSession(res.member, res.token);
        return res.member;
      }),
      catchError(err => throwError(() => new Error(
        err.error?.message ?? 'Invalid or expired OTP. Please try again.'
      ))),
    );
  }

  logout(): void {
    const token = this.authToken();
    this.clearSession();
    if (token) {
      // Fire-and-forget — clear local session first so UI reacts immediately
      this.http.post(
        `${this.base}/auth/logout`, {},
        { headers: { Authorization: `Bearer ${token}` } },
      ).subscribe({ error: () => {} });
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  private setSession(member: Member, token: string): void {
    this.currentMember.set(member);
    this.authToken.set(token);
    localStorage.setItem(MEMBER_KEY, JSON.stringify(member));
    localStorage.setItem(TOKEN_KEY, token);
  }

  /** Call when a 401 is received — clears state without making an API call. */
  invalidateSession(): void {
    this.clearSession();
  }

  private clearSession(): void {
    this.currentMember.set(null);
    this.authToken.set(null);
    localStorage.removeItem(MEMBER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  private loadStoredMember(): Member | null {
    try {
      const raw = localStorage.getItem(MEMBER_KEY);
      return raw ? (JSON.parse(raw) as Member) : null;
    } catch {
      return null;
    }
  }
}
