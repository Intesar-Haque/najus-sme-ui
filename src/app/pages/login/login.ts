import {
  Component, inject, signal, computed,
  viewChildren, ElementRef, OnDestroy,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { AuthService } from '../../core/services/auth.service';

type Step = 1 | 2;

@Component({
  selector: 'app-login',
  imports: [
    RouterLink, FormsModule,
    NzButtonModule, NzInputModule, NzIconModule,
    NzAlertModule, NzSpinModule, NzTagModule, NzToolTipModule,
  ],
  templateUrl: './login.html',
  styleUrl:    './login.less',
})
export class Login implements OnDestroy {
  private auth   = inject(AuthService);
  private router = inject(Router);

  // ── Step state ────────────────────────────────────────────────────────
  step         = signal<Step>(1);
  loading      = signal(false);
  errorMessage = signal('');

  // ── Step 1 ────────────────────────────────────────────────────────────
  memberCode   = signal('');
  maskedEmail  = signal('');

  // ── Step 2 ────────────────────────────────────────────────────────────
  otpDigits    = signal<string[]>(['', '', '', '', '', '']);
  otpInputRefs = viewChildren<ElementRef<HTMLInputElement>>('otpInput');

  otpValue = computed(() => this.otpDigits().join(''));
  otpFull  = computed(() => this.otpDigits().every(d => d !== ''));

  // ── Resend timer ──────────────────────────────────────────────────────
  resendSeconds  = signal(0);
  canResend      = computed(() => this.resendSeconds() === 0);
  private timer?: ReturnType<typeof setInterval>;

  // ── Testimonials (cycling on brand panel) ────────────────────────────
  readonly testimonials = [
    { quote: 'NAJUS SME transformed our reach. We now sell across Bangladesh.', author: 'Fatema B.', biz: 'Rupali Handicrafts' },
    { quote: 'The platform is easy to use and the support team is amazing.', author: 'Karim A.',  biz: 'Sylhet Tea Garden' },
    { quote: 'Joining NAJUS SME was the best business decision we made.', author: 'Nadia I.',   biz: 'Nakshi Collective' },
  ];
  testimonialIdx = signal(0);

  constructor() {
    // Rotate testimonials every 5s
    setInterval(() => {
      this.testimonialIdx.update(i => (i + 1) % this.testimonials.length);
    }, 5000);
  }

  // ── Step 1: Submit membership code ───────────────────────────────────
  submitCode() {
    const code = this.memberCode().trim();
    if (!code) { this.errorMessage.set('Please enter your membership code.'); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.requestOtp(code).subscribe({
      next: ({ maskedEmail }) => {
        this.maskedEmail.set(maskedEmail);
        this.step.set(2);
        this.loading.set(false);
        this.startResendTimer();
        // Focus first OTP box after view updates
        setTimeout(() => this.focusOtpInput(0), 80);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.loading.set(false);
      },
    });
  }

  // ── Step 2: Verify OTP ───────────────────────────────────────────────
  verifyOtp() {
    if (!this.otpFull()) { this.errorMessage.set('Please enter all 6 digits.'); return; }

    this.loading.set(true);
    this.errorMessage.set('');

    this.auth.verifyOtp(this.memberCode(), this.otpValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.loading.set(false);
        this.shakeOtp();
      },
    });
  }

  // ── Resend OTP ───────────────────────────────────────────────────────
  resendOtp() {
    if (!this.canResend()) return;
    this.otpDigits.set(['', '', '', '', '', '']);
    this.errorMessage.set('');
    this.startResendTimer();
    this.auth.requestOtp(this.memberCode()).subscribe();
    setTimeout(() => this.focusOtpInput(0), 80);
  }

  // ── OTP digit inputs ─────────────────────────────────────────────────
  onDigitInput(index: number, event: Event) {
    const raw = (event.target as HTMLInputElement).value;
    const digit = raw.replace(/\D/g, '').slice(-1);
    const digits = [...this.otpDigits()];
    digits[index] = digit;
    this.otpDigits.set(digits);
    if (digit && index < 5) this.focusOtpInput(index + 1);
  }

  onDigitKeydown(index: number, event: KeyboardEvent) {
    const digits = [...this.otpDigits()];
    if (event.key === 'Backspace') {
      if (digits[index]) {
        digits[index] = '';
        this.otpDigits.set(digits);
      } else if (index > 0) {
        digits[index - 1] = '';
        this.otpDigits.set(digits);
        this.focusOtpInput(index - 1);
      }
      event.preventDefault();
    } else if (event.key === 'ArrowLeft'  && index > 0) { this.focusOtpInput(index - 1); }
      else if (event.key === 'ArrowRight' && index < 5) { this.focusOtpInput(index + 1); }
  }

  onDigitPaste(event: ClipboardEvent) {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    const digits = Array.from({ length: 6 }, (_, i) => text[i] ?? '');
    this.otpDigits.set(digits);
    this.focusOtpInput(Math.min(text.length, 5));
  }

  private focusOtpInput(index: number) {
    this.otpInputRefs()[index]?.nativeElement.focus();
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  goBack() {
    this.step.set(1);
    this.otpDigits.set(['', '', '', '', '', '']);
    this.errorMessage.set('');
    clearInterval(this.timer);
  }

  private startResendTimer() {
    this.resendSeconds.set(60);
    clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.resendSeconds() <= 1) { clearInterval(this.timer); this.resendSeconds.set(0); }
      else { this.resendSeconds.update(s => s - 1); }
    }, 1000);
  }

  private shakeOtp() {
    const el = document.querySelector('.otp-row');
    el?.classList.add('otp-row--shake');
    setTimeout(() => el?.classList.remove('otp-row--shake'), 600);
  }

  get activeTestimonial() { return this.testimonials[this.testimonialIdx()]; }

  ngOnDestroy() { clearInterval(this.timer); }
}
