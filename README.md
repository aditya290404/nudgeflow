# NudgeFlow - AI-Native Mini CRM

Hey there! 👋 Welcome to my submission for the **Xeno Engineering Assignment**. 

I built **NudgeFlow**, a full-stack, AI-enhanced CRM designed for direct-to-consumer brands to analyze their audience, build complex segments, and launch targeted marketing campaigns.

I wanted to go beyond just building a basic CRUD app, so I integrated **Google Gemini** to make the CRM truly "AI-Native" and implemented a robust database architecture to handle high-concurrency webhook scenarios.

## 🚀 Live Demo
**Frontend URL:** https://nudgeflow-2pn9-orpin.vercel.app/

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, React 19)
- **Database:** PostgreSQL (hosted on Supabase)
- **ORM:** Prisma
- **Styling:** Tailwind CSS & shadcn/ui
- **AI Integration:** Google Gemini (gemini-2.5-flash)

---

## ✨ Key Features & Architectural Decisions

### 1. AI-Native Segment Builder 🧠
Instead of forcing marketers to use clunky dropdown menus, I integrated the Google Gemini API. Users can type natural language prompts like:
> *"Find high value customers who haven't bought anything in 6 months"*

The backend securely feeds the Prisma schema and the current date into the AI, which instantly generates a perfectly formatted, 100% accurate Prisma `where` filter object. The backend then evaluates this directly against the PostgreSQL database to return the exact customer count.

### 2. Bulletproof Webhook Handling (No Race Conditions) 🛡️
The assignment requires updating delivery stats (`DELIVERED`, `OPENED`, `CLICKED`) as webhooks hit the API. 
If 500 webhooks hit the server at the exact same millisecond, standard database updates (e.g., `count = count + 1`) will cause severe race conditions and data loss. To solve this, I used **Prisma Atomic Increments** (`increment: 1`). This offloads the math directly to the PostgreSQL database engine, ensuring 100% data integrity no matter how high the concurrency is.

### 3. Vercel Serverless Fallback ☁️
Serverless platforms like Vercel instantly kill background tasks the moment an API response is returned. Since the `channel-stub` requires background execution to simulate delayed webhooks, I wrote a graceful fallback mechanism. If the app detects it's running on Vercel and cannot reach a local `channel-stub`, it mathematically simulates the delivery/open/click percentages synchronously in the database so the live demo remains fully functional.

### 4. Premium UI/UX 🎨
I built a responsive, modern interface using Tailwind CSS and standard shadcn/ui components to give it a clean, professional, "Vercel-like" aesthetic.

---

## 💻 How to Run Locally

If you'd like to test the true end-to-end webhook architecture on your local machine:

1. **Clone the repository**
   ```bash
   git clone https://github.com/aditya290404/nudgeflow.git
   cd nudgeflow
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Environment Variables**
   Create a `.env` file in the root directory and add the following:
   ```env
   DATABASE_URL="your_postgresql_database_url"
   GEMINI_API_KEY="your_google_gemini_api_key"
   CHANNEL_STUB_URL="http://localhost:3001"
   ```

4. **Seed the Database**
   I wrote a robust seed script that generates 1,500 hyper-realistic customers and over 7,000 randomized orders to make the dashboard look great.
   ```bash
   npm run db:seed
   ```

5. **Run the Servers**
   You'll need two terminal windows:
   
   *Terminal 1 (Start the mock channel webhook service):*
   ```bash
   cd channel-stub
   npm install
   npm start
   ```

   *Terminal 2 (Start the Next.js CRM):*
   ```bash
   npm run dev
   ```

6. Open `http://localhost:3000` in your browser and start building segments!

---

*Thank you for reviewing my assignment! I had a lot of fun building this and would love to discuss the architectural decisions in an interview.*
