# 🎵 Audiora

**Your AI-Powered Music DJ — Personalized Playlists On-The-Fly**

Audiora is an intelligent music streaming platform that combines the power of AI with free music from Audius to deliver personalized listening experiences. Choose from multiple AI DJ personas, each with their own unique taste and style, to curate the perfect playlist for any mood or moment.

---

## ✨ Features

### 🎧 **AI DJ Personas**
Choose from four distinct AI DJ personalities, each with unique musical preferences:

- **Audiora DJ** - Your personal AI DJ that learns from your listening history to create perfectly tailored playlists
- **Nova** - Deep House & Melodic Techno specialist with atmospheric, progressive vibes
- **Veda** - Minimal & Techno curator focused on clean sound design and underground beats
- **Kai** - Lo-fi & Chillhop expert for relaxing, downtempo study sessions

### 🧠 **Intelligent Playlist Generation**
- **Personalized Recommendations** - AI analyzes your listening history, favorite genres, artists, and completion rates
- **Context-Aware** - Playlists adapt based on time of day and listening patterns
- **Smart Discovery** - Balanced mix of familiar favorites and new discoveries based on your preferences
- **Multi-Factor Scoring** - Tracks are scored using genre match, artist affinity, mood compatibility, and novelty

### 🎵 **Seamless Music Experience**
- **Free Music Streaming** - Powered by Audius API with no account required
- **Real-Time Playback** - Smooth audio player with progress tracking and volume control
- **Queue Management** - View and manage your upcoming tracks
- **Search & Browse** - Explore music by genre, artist, or track name
- **Play History** - Track your listening habits (for authenticated users)

### 🔐 **Authentication**
- **Guest Mode** - Start listening immediately with trending playlists
- **Google OAuth** - Sign in for personalized AI DJ experiences and history tracking
- **JWT Security** - Secure token-based authentication

### 🎨 **Modern UI/UX**
- **Responsive Design** - Beautiful interface that works on all devices
- **Dark/Light Mode** - Theme support for comfortable viewing
- **Smooth Animations** - Polished interactions and transitions
- **shadcn/ui Components** - Modern, accessible UI components

---

## 🛠️ Tech Stack

### **Frontend**
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with Server Components
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - High-quality UI component library
- **Radix UI** - Accessible component primitives
- **Lucide Icons** - Beautiful icon set
- **Vercel Analytics** - Performance monitoring

### **Backend**
- **NestJS** - Progressive Node.js framework
- **TypeScript** - End-to-end type safety
- **Prisma** - Next-generation ORM
- **PostgreSQL** - Robust relational database
- **Redis (ioredis)** - Caching and session management
- **Passport.js** - Authentication middleware
- **JWT** - Secure token-based auth
- **Helmet** - Security headers
- **Rate Limiting** - API protection

### **AI & Music**
- **Google Generative AI (Gemini)** - AI-powered playlist generation and persona intelligence
- **Audius API** - Decentralized music streaming platform
- **Custom AI DJ Engine** - Multi-persona recommendation system with:
  - User taste profiling
  - Genre and artist matching
  - Mood compatibility scoring
  - Time-based relevance
  - Discovery rate optimization
  - Persona influence blending

### **DevOps & Infrastructure**
- **Vercel** - Frontend deployment with CI/CD
- **Railway** - Backend deployment with automated pipelines
- **Docker** - Containerization support
- **GitHub Actions** - Automated testing and deployment
- **Environment Management** - Separate dev/prod configurations

---

## 🎯 How It Works

### **For Guest Users**
1. Visit Audiora and start listening immediately
2. Browse trending tracks and popular genres
3. Enjoy free music streaming without sign-up

### **For Authenticated Users**
1. Sign in with Google OAuth
2. Select your preferred AI DJ persona
3. AI analyzes your listening history and preferences
4. Generate personalized playlists tailored to your taste
5. Discover new music while enjoying familiar favorites
6. Build your listening profile over time for even better recommendations

### **AI DJ Intelligence**
Each AI DJ persona uses a sophisticated scoring algorithm that considers:
- **Genre Affinity** - Matches tracks to your favorite genres
- **Artist Preference** - Prioritizes your top artists
- **Mood Compatibility** - Aligns with your listening mood patterns
- **Novelty Balance** - Introduces new music based on your discovery rate
- **Time Relevance** - Adapts to your listening habits by time of day
- **Persona Influence** - Blends your taste with the DJ's unique style

---

## 🚀 Architecture

```
┌─────────────────────┐
│   Next.js Frontend  │
│   (Vercel)          │
└──────────┬──────────┘
           │
           │ REST API
           │
┌──────────▼──────────┐
│   NestJS Backend    │
│   (Railway)         │
└──────────┬──────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼───┐    ┌───▼────┐
│Audius │    │ Gemini │
│  API  │    │   AI   │
└───────┘    └────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌───▼───┐
│Postgres│   │ Redis │
└────────┘   └───────┘
```

## 🎨 Design Philosophy

Audiora combines modern AI technology with a premium user experience:
- **Personalization First** - Every playlist is uniquely yours
- **Intelligent Discovery** - Find new music you'll love
- **Seamless Experience** - From search to playback, everything just works
- **Beautiful Design** - Modern aesthetics that enhance the music
- **Performance Optimized** - Fast, responsive, and reliable

---

## 📄 License

This project is private and proprietary.

---

## 🙏 Acknowledgments

- **Audius** - For providing free, decentralized music streaming
- **Google Gemini AI** - For powering intelligent playlist generation
- **radix/ui** - For beautiful, accessible UI components
- **Vercel & Railway** - For seamless deployment infrastructure

---

## 👨‍💻 Developer

**Jared Omen**

---

**Built with ❤️ and AI**
