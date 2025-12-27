# Contacts CRUD App

## Tech Stack
- **Angular** – Built using standalone components and Angular routing  
- **PrimeNG** – Used as the component library for tables, dialogs, buttons, and notifications  
- **HttpClient** – Used for all API communication, with an interceptor to automatically attach the API key header

## API
- **Base URL**: `https://contacts-api-production-d41d.up.railway.app/`
- All requests require an API key to be sent in the request headers:
  - `X-API-Key: <your-api-key>`

## How to Run the Project

1. Install dependencies:
   ```bash
   npm install
   
2. ng serve