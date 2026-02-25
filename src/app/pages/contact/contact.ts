import { Component, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NzFormModule }    from 'ng-zorro-antd/form';
import { NzInputModule }   from 'ng-zorro-antd/input';
import { NzButtonModule }  from 'ng-zorro-antd/button';
import { NzIconModule }    from 'ng-zorro-antd/icon';
import { NzSelectModule }  from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
  selector: 'app-contact',
  imports: [
    ReactiveFormsModule,
    NzFormModule, NzInputModule, NzButtonModule, NzIconModule, NzSelectModule,
  ],
  templateUrl: './contact.html',
  styleUrl:    './contact.less',
})
export class Contact {
  private msg = inject(NzMessageService);

  readonly submitting = signal(false);
  readonly submitted  = signal(false);

  readonly subjects = [
    'General Inquiry',
    'Vendor Registration',
    'Product Support',
    'Event Information',
    'Partnership Opportunity',
    'Media & Press',
    'Other',
  ];

  readonly contactInfo = [
    { icon: 'environment',  label: 'Address',      value: '123 NGO Road, Mohakhali, Dhaka 1212, Bangladesh' },
    { icon: 'phone',        label: 'Phone',        value: '+880-1700-000000' },
    { icon: 'mail',         label: 'Email',        value: 'info@najussme.org' },
    { icon: 'clock-circle', label: 'Office Hours', value: 'Sun – Thu: 9 AM – 6 PM (BST)' },
  ];

  readonly form = new FormGroup({
    name:    new FormControl('', [Validators.required, Validators.minLength(2)]),
    email:   new FormControl('', [Validators.required, Validators.email]),
    subject: new FormControl('', Validators.required),
    message: new FormControl('', [Validators.required, Validators.minLength(20)]),
  });

  submit() {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach(c => {
        c.markAsDirty();
        c.updateValueAndValidity();
      });
      return;
    }
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.submitted.set(true);
      this.form.reset();
      this.msg.success('Your message has been sent! We\'ll respond within 24 hours.');
    }, 1200);
  }

  sendAnother() {
    this.submitted.set(false);
  }
}
