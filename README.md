# Resume Builder App

A modern, AI-powered resume builder application that helps users create professional resumes with ease.

## Features

### Installable app

Brightfolio is also configured as an installable Progressive Web App (PWA).
On a supported browser, use the install prompt or the browser's “Add to Home
Screen” action to launch it like a normal mobile app. The app shell and the
last loaded route are cached for a better offline fallback.

### 1. Core Features

#### 1.1 Resume Sections

- **Personal Information**

  - Full Name
  - Professional Title
  - Email
  - Phone
  - Location
  - Photo (optional)

- **Professional Summary**

  - Rich text editor for writing a compelling summary

- **Experience**

  - Job Title
  - Company
  - Start/End Dates
  - Description with bullet points (up to 5 per experience)
  - Add/Remove experiences

- **Education**

  - Degree
  - School
  - Start/End Dates
  - Add/Remove education entries

- **Websites & Social Links**
  - Label
  - URL
  - Add/Remove links

#### 1.2 AI Assistant

- Provides AI-powered suggestions for each section
- Tailored to user's profession
- Real-time suggestions
- Easy one-click application of suggestions

#### 1.3 Templates

- Modern Professional
- Executive
- Minimal
- Creative Professional

### 2. User Interface

#### 2.1 Navigation

- Sticky top navigation bar
- Section navigation with icons
- Back button
- Save Resume button
- Cover Letter link

#### 2.2 Layout

- Two-column design:
  - Left: Form sections
  - Right: Live preview
- Collapsible sections
- Real-time updates

#### 2.3 Features

- Auto-save functionality
- Last saved indicator
- PDF download
- Responsive design

### 3. Data Management

#### 3.1 State Management

- Uses React useState for local state
- Firebase for data persistence
- Real-time updates

#### 3.2 Data Structure

```typescript
interface ResumeData {
  personalInfo: {
    fullName: string;
    title: string;
    email: string;
    phone: string;
    location: string;
    photo?: string;
  };
  profile: string;
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate: string;
    description: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    startDate: string;
    endDate: string;
  }>;
  websites: Array<{
    label: string;
    url: string;
  }>;
}
```

### 4. Authentication & Storage

#### 4.1 User Authentication

- Firebase Authentication
- Sign-in modal for protected actions
- User session management

#### 4.2 Data Storage

- Firebase Firestore
- Automatic saving
- Data synchronization

### 5. AI Integration

#### 5.1 AI Assistant Features

- Context-aware suggestions
- Profession-specific recommendations
- Section-specific content generation
- One-click application of suggestions

#### 5.2 AI Implementation

- Real-time processing
- Error handling
- Loading states
- User feedback

### 6. Export Options

#### 6.1 PDF Generation

- Professional formatting
- Template-based layout
- Download functionality
- Preview before download

### 7. Security Features

#### 7.1 Data Protection

- User authentication required for saving
- Secure data storage
- Protected routes
- Session management

### 8. Performance Optimizations

#### 8.1 Loading States

- Skeleton loading
- Progress indicators
- Error handling
- Fallback UI

#### 8.2 State Management

- Efficient updates
- Debounced saves
- Optimized re-renders

## Getting Started

## Mobile app builds

The project is configured for Capacitor so the same React/Firebase product can
ship as an iPhone and Android app.

```bash
npm install
npm run cap:add:ios       # one time, on macOS with Xcode
npm run cap:add:android   # one time, with Android Studio installed
npm run build:mobile
npm run cap:open:ios
npm run cap:open:android
```

Before store submission, add the Firebase native configuration files and
native Google OAuth client IDs for each platform. Email/password auth already
uses the shared Firebase web SDK.

### Xcode Cloud

The iOS project includes `ios/App/ci_scripts/ci_post_clone.sh`. Xcode Cloud
uses it to install Node dependencies, build the React bundle, and sync the
Capacitor iOS project before archiving the app.

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account

### Installation

1. Clone the repository

```bash
git clone [repository-url]
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables

```bash
cp .env.example .env
```

Fill in your Firebase configuration details in the `.env` file.

4. Start the development server

```bash
npm run dev
# or
yarn dev
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

Proprietary. All rights reserved. See the [LICENSE](LICENSE) file.

This software may not be copied, used, modified, or distributed without
prior written permission from the copyright holder.
