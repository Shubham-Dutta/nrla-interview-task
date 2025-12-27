import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Contact, ContactDto } from './contact.model';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ContactsService {

  // Base API URL (remove trailing slash if present)
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

// Get all contacts
  list(): Observable<Contact[]> {
    return this.http.get<any>(`${this.baseUrl}/contacts`).pipe(
      map((res) => {
        const rows = Array.isArray(res) ? res : res?.data ?? res?.contacts ?? res?.items ?? [];
       
        // Convert raw API rows into the UI Contact model
        return (rows as any[]).map(this.toContact);
      })
    );
  }

  // Create a new contact
  create(dto: ContactDto): Observable<Contact> {
    return this.http.post<any>(`${this.baseUrl}/contacts`, dto).pipe(map(this.toContact));
  }

  // Update an existing contact (PUT /contacts/:id)
  update(id: string, dto: ContactDto): Observable<Contact> {
    return this.http.put<any>(`${this.baseUrl}/contacts/${id}`, dto).pipe(map(this.toContact));
  }

 // Delete a contact
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/contacts/${id}`);
  }

  // Reset the database (useful for testing)
  seed(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/contacts/seed/`, {});
  }

  // Convert the API response shape into our Contact model
  // Keeps the UI consistent even if some fields are missing
  private toContact = (r: any): Contact => ({
    id: String(r?.id ?? ''),
    firstName: r?.firstName ?? '',
    lastName: r?.lastName ?? '',
    email: r?.email ?? null,
    phone: r?.phone ?? null,
    company: r?.company ?? null,
    image: r?.image ?? null,
  });
}
