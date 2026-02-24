import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

import { NzButtonModule }    from 'ng-zorro-antd/button';
import { NzIconModule }      from 'ng-zorro-antd/icon';
import { NzTagModule }       from 'ng-zorro-antd/tag';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzEmptyModule }     from 'ng-zorro-antd/empty';
import { NzDividerModule }   from 'ng-zorro-antd/divider';
import { NzInputModule }     from 'ng-zorro-antd/input';
import { NzSelectModule }    from 'ng-zorro-antd/select';
import { NzFormModule }      from 'ng-zorro-antd/form';
import { NzMessageService }  from 'ng-zorro-antd/message';
import { NzSpinModule }      from 'ng-zorro-antd/spin';
import { NzResultModule }    from 'ng-zorro-antd/result';

import { DataService } from '../../../core/services/data.service';
import { SmeEvent, EventType } from '../../../core/models';

export interface RegistrationForm {
  fullName: string;
  email: string;
  phone: string;
  attendees: number;
  message: string;
}

@Component({
  selector: 'app-event-detail',
  imports: [
    RouterLink, FormsModule, DatePipe,
    NzButtonModule, NzIconModule, NzTagModule, NzBreadCrumbModule,
    NzEmptyModule, NzDividerModule, NzInputModule, NzSelectModule,
    NzFormModule, NzSpinModule, NzResultModule,
  ],
  templateUrl: './detail.html',
  styleUrl:    './detail.less',
})
export class EventDetail implements OnInit {
  private data    = inject(DataService);
  private route   = inject(ActivatedRoute);
  private router  = inject(Router);
  private message = inject(NzMessageService);

  event          = signal<SmeEvent | null>(null);
  relatedEvents  = signal<SmeEvent[]>([]);
  notFound       = signal(false);

  // Registration form state
  submitting    = signal(false);
  submitted     = signal(false);

  form: RegistrationForm = {
    fullName: '',
    email: '',
    phone: '',
    attendees: 1,
    message: '',
  };

  readonly attendeeOptions = [1, 2, 3, 4, 5];

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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); return; }

    const ev = this.data.getEventById(id);
    if (!ev) { this.notFound.set(true); return; }

    this.event.set(ev);
    this.relatedEvents.set(this.data.getRelatedEvents(id, ev.type));
  }

  onSubmit(ngForm: NgForm) {
    if (ngForm.invalid) {
      Object.values(ngForm.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }

    this.submitting.set(true);

    // Simulate API call
    setTimeout(() => {
      this.submitting.set(false);
      this.submitted.set(true);
    }, 1400);
  }

  resetForm(ngForm: NgForm) {
    ngForm.resetForm();
    this.form = { fullName: '', email: '', phone: '', attendees: 1, message: '' };
    this.submitted.set(false);
  }

  goBack() {
    this.router.navigate(['/events']);
  }
}
