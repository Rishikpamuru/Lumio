# Lumio - Learning Management System

Lumio is a modern Learning Management System built with React, TypeScript, Express, and Prisma. It provides a comprehensive platform for educational institutions with AI-powered features for enhanced learning and teaching experiences.

## 🚀 Features

### Core Features
- **Class Management**: Create and manage classes with unique join codes
- **Assignment System**: Create, distribute, and submit assignments
- **User Roles**: Student, Teacher, and Admin role-based access control
- **Grade Tracking**: Comprehensive grading system with analytics
- **Submission Viewer**: View and manage student submissions

### AI-Powered Features
- **AI Grading Assistant**: Automated grading with AI feedback
- **AI Assignment Generator**: Generate assignments with various question types
- **Student AI Assistant**: Help with upcoming assignments and grade calculations
- **Teacher AI Assistant**: Classroom management and assignment creation assistance

### Authentication & Security
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for students, teachers, and admins
- **Demo User System**: Built-in demo accounts for testing

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Router** for navigation
- **CSS Modules** for styling

### Backend
- **Express.js** with TypeScript
- **Prisma ORM** with SQLite database
- **JWT** for authentication
- **OpenAI API** for AI features

### Development Tools
- **ESLint** for code linting
- **TypeScript** for type safety
- **Node.js** runtime environment

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key (for AI features)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Rishikpamuru/Lumio.git
   cd Lumio
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your-jwt-secret-key"
   OPENAI_API_KEY="your-openai-api-key"
   ```

4. **Set up the database**
   ```bash
   cd server
   npx prisma migrate dev
   npx prisma db seed
   ```

5. **Start the development servers**
   
   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```
   
   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

## 👥 Demo Accounts

The system includes built-in demo accounts for testing:

- **Admin**: Username: `12345678`, Password: `password`
- **Teacher**: Username: `87654321`, Password: `password`
- **Student**: Username: `11223344`, Password: `password`

## 🎯 Usage

### For Students
1. Log in with student credentials
2. Join classes using join codes provided by teachers
3. View and submit assignments
4. Track grades and use the AI assistant for help

### For Teachers
1. Log in with teacher credentials
2. Create and manage classes
3. Create assignments (manually or with AI assistance)
4. Grade submissions and provide feedback
5. Use AI grading for faster assessment

### For Admins
1. Log in with admin credentials
2. Manage users and classes
3. Access development tools and system overview

## 🤖 AI Features

This application integrates with OpenAI's GPT-4 model to provide:

- **Automated Grading**: AI analyzes student submissions and provides grades with feedback
- **Assignment Generation**: AI creates assignments with multiple choice questions and essays
- **Student Assistant**: Helps students with assignment planning and grade calculations
- **Teacher Assistant**: Assists with classroom management and curriculum planning

**Note**: AI features require a valid OpenAI API key. The AI is used to enhance the educational experience but should be used in conjunction with human oversight.

## 📁 Project Structure

```
Lumio/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Page components
│   │   └── ...
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Express middleware
│   │   └── ...
│   ├── prisma/            # Database schema and migrations
└── README.md
```

## 🔒 Security Notes

- This is a development/demo version with simplified authentication
- Demo accounts use plaintext passwords for ease of testing
- In production, implement proper password hashing and security measures
- Secure your OpenAI API key and other environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ AI Usage Disclaimer

This project incorporates AI technology powered by OpenAI's language models to enhance educational experiences. The AI features include automated grading assistance, assignment generation, and educational support tools. While AI can provide valuable assistance, all AI-generated content should be reviewed and validated by human educators. The AI is designed to augment, not replace, human judgment in educational settings.

## 🐛 Known Issues
1. User auth (teacher/student roles)
2. Classes with join codes
3. Assignments & Quizzes (MCQ auto-grading)
4. Submissions with grading + feedback (manual feedback to add later)
5. Basic dashboards & placeholder analytics

## Getting Started

### 1. Install Dependencies
```
npm install
npm install -w client
npm install -w server
```

### 2. Environment Setup
Copy `server/.env.example` to `server/.env` and fill values.

### 3. Database
Adjust `DATABASE_URL` (Postgres example). Then:
```
cd server
npx prisma migrate dev --name init
```

### 4. Run Dev
From repo root:
```
npm run dev:server
```
In another terminal:
```
npm run dev:client
```
Or concurrently (may differ on Windows):
```
npm run dev
```

API default runs on `http://localhost:4000` and client on `http://localhost:5173`.

## AI Key
Put AI key in `server/.env` as `AI_API_KEY=...`. The file `src/services/aiKey.ts` exposes a helper `getAIKey()` for any AI feature modules.

## Next Steps / Ideas
- Demo environment uses simplified authentication
- Database resets may be needed during development
- AI features require stable internet connection

## 📞 Support

For support, issues, or questions:
- Open an issue on GitHub
- Contact the development team
- Check the documentation for troubleshooting

---

**Made with ❤️ for education**
