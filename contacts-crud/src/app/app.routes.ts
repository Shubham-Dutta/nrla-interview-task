import { Routes } from '@angular/router';
import { ContactsPageComponent } from './contacts/contacts.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'contacts' },
  { path: 'contacts', component: ContactsPageComponent },
  { path: '**', redirectTo: 'contacts' }
];
