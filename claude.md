# UniCal - AI-Powered Student Scheduler

*Portfolio Project for New Graduate Job Applications*

## Project Overview

**Logline**: A smart scheduling tool that helps students stay organized during semesters/quarters by extracting syllabus data and creating personalized study schedules.

**Goal**: Showcase technical skills and product thinking to potential employers, not build a startup.

**Inspiration**: Like Syllabuddy but with enhanced AI features and better UX.

---

## Core Features

### Tier 1 (Free - No Signup)
• Upload syllabus (PDF, Word, image)
• Basic schedule extraction  
• Simple calendar view
• Export to Google/Apple Calendar
• **Limitation**: Basic AI parsing only

### Tier 2 (Freemium - Signup Required)
• One free upload, then need to sign up
• **AI Chat Assistant** for schedule optimization
• Smart study time recommendations
• Integration with external activities
• Advanced calendar customization
• Progress tracking

---

## AI Integration Strategy

### 1. Smart Onboarding Process
```
AI Assistant: "Hi! I'm your scheduling assistant. Let's set up your perfect semester!"

Step 1: "When does your semester start and end?"
Step 2: "Upload your syllabus - I'll extract all the important dates!"
Step 3: "Do you have any other commitments? Job, internship, extracurriculars?"
Step 4: "What's your study style? Morning person or night owl?"
Step 5: "Let me create your personalized schedule!"
```

### 2. Document Intelligence
• AI processes syllabi to extract:
  - Assignment due dates and types
  - Exam schedules and weight
  - Office hours and important dates
  - Course difficulty estimation
  - Time requirement predictions

### 3. Conversational Onboarding
```javascript
// AI chat examples:
"I work 20 hours a week at Starbucks"
→ AI: "What days and times? Should I avoid scheduling study sessions then?"

"I need to study LeetCode for interviews"
→ AI: "How many problems per week? Morning or evening preference?"

"I have an actuarial exam in March"
→ AI: "Which exam? I'll create a study plan with increasing intensity."
```

### 4. Intelligent Scheduling
• AI optimization considers:
  - Course difficulty and workload
  - Personal energy patterns (morning vs night person)
  - Deadline clustering and stress management
  - Work/life balance optimization
  - Study technique recommendations

---

## Tech Stack

### Frontend: Next.js 14 + TypeScript
• **Why**: Modern React framework with App Router
• **Benefits**: Server-side rendering, API routes, excellent DX
• **Styling**: Tailwind CSS + shadcn/ui components

### Backend: Next.js API Routes + Supabase
• **Database**: PostgreSQL via Supabase
• **Authentication**: Supabase Auth (email/password, OAuth)
• **File Storage**: Supabase Storage for uploaded documents
• **Real-time**: Supabase real-time subscriptions

### AI Integration: OpenAI GPT-4
• **Document parsing**: Extract data from PDFs/images
• **Chat interface**: Conversational onboarding and optimization
• **Smart recommendations**: Schedule optimization and study planning

### Additional Tools
• **Calendar**: FullCalendar.js for schedule visualization
• **File Upload**: react-dropzone for drag-and-drop
• **PDF Processing**: pdf-parse for document extraction
• **State Management**: Zustand for client state
• **Form Handling**: React Hook Form + Zod validation

---

## Project Setup (Vercel Template)

### 1. Initialize Project
```bash
npx create-next-app@latest unical --example with-supabase
cd unical
npm install
```

### 2. Environment Variables (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
```

### 3. Add Dependencies
```bash
# UI Components
npm install @radix-ui/react-dialog @radix-ui/react-select
npm install lucide-react class-variance-authority clsx

# Calendar and File Upload  
npm install @fullcalendar/react @fullcalendar/daygrid
npm install react-dropzone

# AI and Document Processing
npm install openai pdf-parse

# State Management and Forms
npm install zustand react-hook-form @hookform/resolvers zod
```

### 4. Setup shadcn/ui
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea
npx shadcn-ui@latest add dialog select calendar
npx shadcn-ui@latest add sidebar navigation-menu
npx shadcn-ui@latest add form progress badge
```

---

## Database Schema

### Tables
```sql
-- Users (handled by Supabase Auth)
-- Additional user preferences
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  study_preferences JSONB,
  timezone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semesters/Terms
CREATE TABLE semesters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploaded documents
CREATE TABLE documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  semester_id UUID REFERENCES semesters,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  processing_status TEXT DEFAULT 'pending',
  extracted_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schedule items (assignments, exams, activities)
CREATE TABLE schedule_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  semester_id UUID REFERENCES semesters,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  item_type TEXT NOT NULL, -- 'assignment', 'exam', 'study_block', 'work', etc.
  estimated_hours INTEGER,
  priority INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## File Structure

```
unical/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── calendar/
│   │   ├── upload/
│   │   ├── chat/
│   │   └── settings/
│   ├── api/
│   │   ├── ai/
│   │   ├── upload/
│   │   └── schedules/
│   └── globals.css
├── components/
│   ├── Dashboard/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Calendar.tsx
│   ├── Forms/
│   │   ├── UploadForm.tsx
│   │   └── OnboardingChat.tsx
│   └── ui/ (shadcn components)
├── lib/
│   ├── ai/
│   │   ├── openai.ts
│   │   └── prompts.ts
│   ├── supabase/
│   └── utils.ts
└── types/
    └── database.ts
```

---

## Development Phases

### Phase 1: MVP (3-4 weeks)
• Basic auth and dashboard
• File upload functionality  
• Simple syllabus parsing (no AI)
• Basic calendar view
• Manual schedule creation

### Phase 2: AI Integration (2-3 weeks)
• OpenAI integration for document parsing
• Conversational onboarding
• Smart schedule generation
• Chat interface for optimization

### Phase 3: Polish & Portfolio (1-2 weeks)
• UI/UX improvements
• Mobile responsiveness
• Documentation and demo
• Deployment optimization

---
## Security
Please design and implement all features using secure system design patterns. Ensure:

All user data is private and access is restricted based on role/permissions.

Frontend code uses secure hooks (React/Next.js) without exposing API keys or sensitive logic to the client.

Backend (API routes, middleware, or server components) enforces authentication and authorization with Supabase JWTs/session tokens.

Database queries use RLS (Row Level Security) policies to prevent unauthorized access.

Avoid storing secrets in the client, use environment variables securely.

Follow the principle of least privilege for Supabase roles, keys, and API access.

All sensitive data should be encrypted in transit (HTTPS) and, if possible, at rest in the DB.

Add input validation and sanitization to prevent XSS, SQL injection, and CSRF attacks.

Return only the minimum necessary data to the frontend.

Please explain the reasoning behind each design choice and provide example code for both frontend hooks and backend handlers following these principles.”


---

## Troubleshooting Common Issues

### Sign-in/Sign-up Buttons Grayed Out
• Check `.env.local` format (no spaces around `=`)
• Verify Supabase URL starts with `https://`
• Ensure anon key is complete (starts with `eyJ`)
• Restart development server after env changes
• Check Supabase dashboard auth settings

### Dashboard Layout Setup
```bash
# Create required folders
mkdir -p app/\(dashboard\)
mkdir -p components/Dashboard
mkdir -p components/Forms
mkdir -p lib/stores
```

### Authentication Flow
```typescript
// app/(dashboard)/layout.tsx
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

## Market Opportunity

### Target Market
• **Primary**: College students (20+ million in US)
• **Secondary**: Graduate students, certification candidates
• **Pain Point**: Students struggle to balance coursework, jobs, internships, and personal commitments

### Competitive Landscape
| Tool | Features | Price | Limitations |
|------|----------|-------|-------------|
| Syllabuddy | Basic syllabus parsing | Free/Premium | Limited features |
| MyStudyLife | Manual input | $4.99/mo | No AI, manual setup |
| Google Calendar | Basic scheduling | Free | No academic context |
| **UniCal** | **AI-powered, comprehensive** | **Freemium** | **First-mover with AI** |

### Why This Will Impress Employers
• **Practical application** - solves a real student problem
• **AI integration** - shows understanding of modern tech trends  
• **Professional execution** - not just another todo app
• **Complete product thinking** - includes business model, UX flow
• **Technical depth** - full-stack with modern technologies

---

## Demo Strategy

### Live Demo Points
• **Upload syllabus**: Show AI extracting dates and assignments
• **AI onboarding**: Demonstrate conversational interface
• **Schedule optimization**: Show AI recommendations in action
• **Calendar integration**: Export to Google Calendar
• **Mobile responsiveness**: Show it works on phone
