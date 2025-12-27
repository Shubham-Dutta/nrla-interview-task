import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { ContactsService } from '../shared/contacts/contacts.service';
import { Contact, ContactDto } from '../shared/contacts/contact.model';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

@Component({
  selector: 'app-contacts-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    ProgressSpinnerModule,
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: 'contacts.component.html',
  styleUrls: ['contacts.component.scss'],
})
export class ContactsPageComponent implements OnInit {
  contacts = signal<Contact[]>([]);
  loading = signal(false);
  saving = signal(false);
  private namePattern = /^[a-zA-Z][a-zA-Z\s'.-]*$/;
  private phonePattern = /^[0-9+\-() x]*$/;

  private minDigitsInPhone(minDigits: number) {
    return (control: any) => {
      const v = (control.value ?? '').toString().trim();
      if (!v) return null; 
      const digits = v.replace(/\D/g, '');
      return digits.length >= minDigits ? null : { phoneMinDigits: true };
    };
  }

  // Search text for filtering the table
  searchText = signal('');

  // If this has a value, we are editing an existing contact
  editingId = signal<string | null>(null);

  // Controls the create/edit dialog
  dialogOpen = false;

  dialogTitle = computed(() => (this.editingId() ? 'Edit Contact' : 'Create Contact'));
  submitLabel = computed(() => (this.editingId() ? 'Update' : 'Create'));

  // Client-side search across common fields
  filteredContacts = computed(() => {
    const q = this.searchText().toLowerCase().trim();
    const list = this.contacts();
    if (!q) return list;

    return list.filter((c) =>
      [c.firstName, c.lastName, c.email, c.phone, c.company]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  });

  // Form used for both create and edit
  form = this.fb.group({
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern(this.namePattern)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(40), Validators.pattern(this.namePattern)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(this.phonePattern), this.minDigitsInPhone(7)]],
    company: ['', [Validators.required, Validators.maxLength(60)]],
  });



  constructor(
    private fb: FormBuilder,
    private api: ContactsService,
    private toast: MessageService,
    private confirm: ConfirmationService
  ) { }

  ngOnInit(): void {
    setTimeout(() => this.load(), 0);
  }

  // Fetch contacts from the API and update the table
  load(): void {
    this.loading.set(true);
    this.api.list().subscribe({
      next: (rows) => {
        this.contacts.set(rows ?? []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'Failed to load contacts',
          detail: this.readableError(err),
        });
      },
    });
  }

  // Open dialog in "create" mode with empty form
  openCreate(): void {
    this.editingId.set(null);
    this.form.reset(
      { firstName: '', lastName: '', email: '', phone: '', company: '' },
      { emitEvent: false }
    );
    this.dialogOpen = true;
  }

  // Open dialog in "edit" mode and fill the form with selected contact
  openEdit(c: Contact): void {
    if (!c?.id) {
      this.toast.add({ severity: 'error', summary: 'Edit failed', detail: 'Missing contact id.' });
      return;
    }

    this.editingId.set(c.id);

    this.form.patchValue(
      {
        firstName: c.firstName ?? '',
        lastName: c.lastName ?? '',
        email: c.email ?? '',
        phone: c.phone ?? '',
        company: c.company ?? '',
      },
      { emitEvent: false }
    );

    this.dialogOpen = true;
  }

  // Close dialog and reset form UI state
  closeDialog(): void {
    this.dialogOpen = false;
    this.form.markAsPristine();
    this.form.markAsUntouched();
  }

  // Create or update depending on whether editingId exists
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const dto = this.form.getRawValue() as ContactDto;
    const id = this.editingId();
    const req$ = id ? this.api.update(id, dto) : this.api.create(dto);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogOpen = false;

        this.toast.add({
          severity: 'success',
          summary: id ? 'Contact updated' : 'Contact created',
        });

        this.load();
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'Save failed',
          detail: this.readableError(err),
        });
      },
    });
  }

  // Ask for confirmation before deleting
  confirmDelete(c: Contact): void {
    if (!c?.id) {
      this.toast.add({ severity: 'error', summary: 'Delete failed', detail: 'Missing contact id.' });
      return;
    }

    this.confirm.confirm({
      header: 'Delete contact?',
      message: `Are you sure you want to delete ${c.firstName} ${c.lastName}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Delete',
      rejectLabel: 'Cancel',
      accept: () => this.onDelete(c.id),
    });
  }

  // Delete contact, then reload list
  private onDelete(id: string): void {
    this.api.delete(id).subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Contact deleted' });
        this.load();
      },
      error: (err) => {
        this.toast.add({
          severity: 'error',
          summary: 'Delete failed',
          detail: this.readableError(err),
        });
      },
    });
  }

  // Reset API data using the seed endpoint, then reload
  onSeed(): void {
    this.loading.set(true);
    this.api.seed().subscribe({
      next: () => {
        this.toast.add({ severity: 'success', summary: 'Database seeded' });
        this.load();
      },
      error: (err) => {
        this.loading.set(false);
        this.toast.add({
          severity: 'error',
          summary: 'Seed failed',
          detail: this.readableError(err),
        });
      },
    });
  }

  // Convert API error into a readable message for toast
  private readableError(err: any): string {
    const msg = err?.error?.message || err?.error?.error || err?.message || 'Unknown error';
    return typeof msg === 'string' ? msg : JSON.stringify(msg);
  }
}
