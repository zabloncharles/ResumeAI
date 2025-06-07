# Resume Builder App

A modern, AI-powered resume builder application that helps users create professional resumes with ease.

## Features

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

This project is licensed under the MIT License - see the LICENSE file for details.
