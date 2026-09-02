import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { timer } from 'rxjs';

import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule }   from 'ng-zorro-antd/spin';

import { ApiService } from '../../core/services/api.service';

/**
 * Landing page for the SSLCommerz redirect after a payment attempt (bugs
 * #26/#43 — see SQA-FIX.md Fix #2). The backend's success/fail/cancel/error
 * callbacks all send the browser to one of these paths with ?tran_id=...;
 * before this fix none of these routes existed at all, so a customer who
 * actually paid was silently bounced to the homepage with no confirmation.
 *
 * The redirect itself only tells us the gateway round-trip finished, not
 * necessarily that our own IPN/success confirmation has landed yet — so
 * this polls GET /api/payment/status/:tranId a few times before giving up.
 */
type Outcome = 'success' | 'fail' | 'cancel' | 'error';

@Component({
  selector: 'app-payment-result',
  imports: [RouterLink, NzResultModule, NzButtonModule, NzSpinModule],
  templateUrl: './payment-result.html',
  styleUrl: './payment-result.less',
})
export class PaymentResult implements OnInit {
  private api        = inject(ApiService);
  private route      = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  private static readonly POLL_ATTEMPTS = 4;
  private static readonly POLL_DELAY_MS = 1500;

  outcome: Outcome = 'error';
  checking  = signal(true);
  confirmed = signal(false);
  eventTitle = signal<string | null>(null);
  eventId    = signal<string | null>(null);
  amountPaid = signal<number>(0);

  ngOnInit() {
    this.outcome = (this.route.snapshot.data['outcome'] as Outcome) ?? 'error';
    const tranId = this.route.snapshot.queryParamMap.get('tran_id');

    // The gateway itself said fail/cancel — no point polling for a status
    // that isn't going to change.
    if (!tranId || this.outcome === 'fail' || this.outcome === 'cancel') {
      this.checking.set(false);
      return;
    }

    this.pollStatus(tranId, PaymentResult.POLL_ATTEMPTS);
  }

  private pollStatus(tranId: string, attemptsLeft: number) {
    this.api.getPaymentStatus(tranId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const reg = res.registration;
          if (reg?.status === 'confirmed' || res.transactionStatus === 'Complete') {
            this.confirmed.set(true);
            this.eventTitle.set(reg?.eventTitle ?? null);
            this.eventId.set(reg?.eventId ?? null);
            this.amountPaid.set(reg?.amountPaid ?? res.amount);
            this.checking.set(false);
            return;
          }
          if (reg?.status === 'cancelled' || ['Failed', 'Canceled'].includes(res.transactionStatus)) {
            this.confirmed.set(false);
            this.checking.set(false);
            return;
          }
          // Still Pending — the IPN callback may not have landed yet.
          if (attemptsLeft > 1) {
            timer(PaymentResult.POLL_DELAY_MS)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.pollStatus(tranId, attemptsLeft - 1));
          } else {
            this.checking.set(false);
          }
        },
        error: () => this.checking.set(false),
      });
  }
}
