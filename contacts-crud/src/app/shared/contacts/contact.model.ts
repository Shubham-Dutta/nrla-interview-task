export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  image?: string | null;
}

export type ContactDto = Omit<Contact, 'id'>;
