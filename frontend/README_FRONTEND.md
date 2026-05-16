# AtomQuest Portal - Frontend

## Quick Start

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Running the App
```bash
npm start
# App runs on http://localhost:3000
```

### Build for Production
```bash
npm run build
# Creates optimized build in `build/` folder
```

## Project Structure

```
src/
├── pages/           # Page components (Login, Dashboard)
├── components/      # Reusable components
├── services/        # API calls (api.js)
├── context/         # React Context (AuthContext)
├── utils/           # Helper functions
└── App.js           # Main app component
```

## Features

### Authentication
- Login page with demo user selection
- JWT token management
- Protected routes

### Pages
- **Login**: User selection and authentication
- **Dashboard**: Navigation hub with role-based menu

### Services
- API client with axios
- Automatic token injection in headers
- Error handling

## Demo Users

```
alice@acme.com - Employee
bob@acme.com - Manager
charlie@acme.com - Admin
```

No password required for demo.

## Deployment

### Deploy to Vercel
```bash
npm run build
# Push to GitHub, connect to Vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag & drop `build/` folder to Netlify
```

## Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (irreversible)
