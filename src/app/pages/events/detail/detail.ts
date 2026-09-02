import { Component, inject, signal, computed, OnInit, DestroyRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';

import { NzButtonModule }    from 'ng-zorro-antd/button';
import { NzIconModule }      from 'ng-zorro-antd/icon';
import { NzTagModule }       from 'ng-zorro-antd/tag';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzEmptyModule }     from 'ng-zorro-antd/empty';
import { NzDividerModule }   from 'ng-zorro-antd/divider';
import { NzMessageService }  from 'ng-zorro-antd/message';
import { NzSpinModule }      from 'ng-zorro-antd/spin';
import { NzModalModule }     from 'ng-zorro-antd/modal';
import { NzResultModule }    from 'ng-zorro-antd/result';
import { NzFormModule }      from 'ng-zorro-antd/form';
import { NzInputModule }     from 'ng-zorro-antd/input';
import { NzSelectModule }    from 'ng-zorro-antd/select';

import { ApiService } from '../../../core/services/api.service';
import { SmeEvent, EventType } from '../../../core/models';

@Component({
  selector: 'app-event-detail',
  imports: [
    RouterLink, DatePipe, FormsModule,
    NzButtonModule, NzIconModule, NzTagModule, NzBreadCrumbModule,
    NzEmptyModule, NzDividerModule, NzSpinModule, NzModalModule, NzResultModule,
    NzFormModule, NzInputModule, NzSelectModule,
  ],
  templateUrl: './detail.html',
  styleUrl:    './detail.less',
})
export class EventDetail implements OnInit {
  private api        = inject(ApiService);
  private route      = inject(ActivatedRoute);
  private router     = inject(Router);
  private message    = inject(NzMessageService);
  private destroyRef = inject(DestroyRef);

  event         = signal<SmeEvent | null>(null);
  relatedEvents = signal<SmeEvent[]>([]);
  notFound      = signal(false);
  loading       = signal(true);
  submitting    = signal(false);
  modalVisible  = signal(false);
  registered    = signal(false);

  @ViewChild('regForm') regForm?: NgForm;

  readonly attendeeOptions = [1, 2, 3, 4, 5];

  form = { full_name: '', email: '', attendees: 1 };

  // Computed helpers
  typeLabel = computed(() => {
    const map: Record<EventType, string> = {
      'trade-fair':  'Trade Fair',
      'workshop':    'Workshop',
      'exhibition':  'Exhibition',
      'webinar':     'Webinar',
      'networking':  'Networking',
    };
    return this.event() ? map[this.event()!.type] : '';
  });

  typeColor = computed(() => {
    const map: Record<EventType, string> = {
      'trade-fair':  'orange',
      'workshop':    'blue',
      'exhibition':  'purple',
      'webinar':     'cyan',
      'networking':  'green',
    };
    return this.event() ? map[this.event()!.type] : 'default';
  });

  typeIcon = computed(() => {
    const map: Record<EventType, string> = {
      'trade-fair':  'shop',
      'workshop':    'tool',
      'exhibition':  'picture',
      'webinar':     'video-camera',
      'networking':  'team',
    };
    return this.event() ? map[this.event()!.type] : 'calendar';
  });

  isMultiDay = computed(() => {
    const e = this.event();
    return e ? e.date !== e.endDate : false;
  });

  // Fix for QA bug #36 ("if the description is too long, full description
  // is not displaying — need a tooltip or scrollable field") — see
  // SQA-FIX.md Fix #24. The description was actually always fully
  // rendered (confirmed live with a 2000+ character stress-test value —
  // no overflow, no clipping, text just wraps) — the real gap was no way
  // to collapse a long one, so the page could run very long. Adds a
  // clamp + "Show more/less" toggle, which is what was actually asked for.
  descExpanded = signal(false);
  descIsLong   = computed(() => (this.event()?.description?.length ?? 0) > 400);

  canRegister = computed(() => {
    const e = this.event();
    if (!e || !e.registrationOpen || this.registered()) return false;
    return e.ticketsRemaining === null || e.ticketsRemaining > 0;
  });

  isSoldOut = computed(() => {
    const e = this.event();
    return e ? e.ticketsRemaining !== null && e.ticketsRemaining === 0 : false;
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.loading.set(false); return; }

    this.api.getEventById(id).pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap(event => {
        if (!event) return of({ event: null as SmeEvent | null, related: [] as SmeEvent[] });
        return this.api.getRelatedEvents(id).pipe(
          switchMap(related => of({ event, related })),
        );
      }),
    ).subscribe({
      next: ({ event, related }) => {
        if (!event) {
          this.notFound.set(true);
        } else {
          this.event.set(event);
          this.relatedEvents.set(related);
          // Fix for QA bug #41 ("should display user as registered while
          // viewing the event detail again") — see SQA-FIX.md Fix #20.
          // Previously `registered` only ever became true for the rest of
          // this same browser session (set after a successful submit) —
          // reloading or revisiting the page lost it entirely, even for a
          // logged-in member who really is registered.
          if (event.alreadyRegistered) {
            this.registered.set(true);
          }
          // Reset per-event UI state — otherwise navigating from one event
          // to another (component reuse) could carry over an expanded
          // description from the last one. Fix #36, SQA-FIX.md Fix #24.
          this.descExpanded.set(false);
        }
        this.loading.set(false);
      },
      error: () => { this.notFound.set(true); this.loading.set(false); },
    });
  }

  openModal() {
    this.form = { full_name: '', email: '', attendees: 1 };
    this.modalVisible.set(true);
  }

  confirmRegister() {
    if (this.regForm?.invalid) {
      Object.values(this.regForm.controls).forEach(c => { c.markAsDirty(); c.updateValueAndValidity(); });
      return;
    }

    const id = this.route.snapshot.paramMap.get('id')!;
    this.submitting.set(true);

    this.api.registerForEvent(id, this.form).subscribe({
      next: (res) => {
        // Paid event: registration is only 'pending' until payment clears —
        // send the browser to the gateway instead of celebrating early
        // (bugs #26/#43, see SQA-FIX.md Fix #2). The seat isn't reserved
        // yet either, so ticketsRemaining is intentionally left untouched.
        if (res.requires_payment && res.payment_url) {
          window.location.href = res.payment_url;
          return;
        }

        this.submitting.set(false);
        this.modalVisible.set(false);
        this.registered.set(true);
        this.message.success(res.message);
        const e = this.event();
        if (e && e.ticketsRemaining !== null) {
          this.event.set({ ...e, ticketsRemaining: e.ticketsRemaining - 1, ticketsSold: e.ticketsSold + 1 });
        }
      },
      error: (err) => {
        this.submitting.set(false);
        this.message.error(err.error?.message ?? 'Registration failed. Please try again.');
      },
    });
  }

  goBack() {
    this.router.navigate(['/events']);
  }
}
