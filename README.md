# 🎯 Programming Quiz Hosted

A modern, responsive web application for taking and hosting programming quizzes across multiple technologies. Designed with a focus on user experience, performance tracking, and accessibility.


## 🚀 Key Features

### 👤 User Management
- Secure user **registration**, **login**, and **logout**
- **Profile dashboard** with quiz stats and recent activity
- Password reset functionality

### 🧠 Quiz System
- Wide range of topics: **Java, C, C++, Python, SQL, CSS, JavaScript, DSA**
- Randomized questions with scoring
- Real-time answer validation
- Completion summary with performance tracking

### 🌙 UI/UX
- Fully **responsive** layout (mobile + desktop)
- **Dark Mode** and **Light Mode** toggle
- Intuitive navigation bar with route-based highlighting

### 🌐 Social & Developer Links
- Direct links to GitHub, LinkedIn, YouTube, Instagram, and Portfolio
- Footer includes **Buy Me a Coffee** support link

---

## 📸 Screenshots

| Sign Up Page | Login Page |
|-------------|------------|
| ![Signup Screenshot](screenshots/signup.png) | ![Login Screenshot](screenshots/login.png) |

| Main Page | Quiz Page |
|-----------|-----------|
| ![Main Screenshot](screenshots/main.png) | ![Quiz Screenshot](screenshots/quiz.png) |

| Dark Mode | Light Mode |
|-----------|------------|
| ![Dark Mode](screenshots/dark.png) | ![Light Mode](screenshots/light.png) |

| Quiz Sample |
|-------------|
| ![1st Quiz Screenshot](screenshots/1quiz.png) |

---

## 🛠️ Tech Stack

### 🔧 Frontend
- **HTML5**, **CSS3**, **JavaScript**
- Responsive design with Flexbox/Grid
- Icon Libraries: [Boxicons](https://boxicons.com/), [Tabler Icons](https://tabler.io/icons)

### 🌍 Deployment
- **Node.js** for development server
- **Vercel** for frontend hosting

### 🧪 Testing
- Manual QA testing in Chrome, Firefox, Edge
- Jest setup configured (basic)

---

## 🔗 Developer & Social Links

- **🌐 Portfolio:** [portfolio-react-app-rho.vercel.app](https://portfolio-react-app-rho.vercel.app/)
- **💻 GitHub:** [github.com/Vishal-Sonwane-2004](https://github.com/Vishal-Sonwane-2004)
- **☕ Buy Me a Coffee:** [buymeacoffee.com/devVishal](https://buymeacoffee.com/devVishal)
- **📷 Instagram:** [@its.Vishal.2004](https://www.instagram.com/its.Vishal.2004)
- **🎥 YouTube:** [ProgrammingWithVishal](https://www.youtube.com/@ProgrammingWithVishal)
- **💼 LinkedIn:** [Vishal-sonwane-079a621ba](https://www.linkedin.com/in/Vishal-sonwane-079a621ba/)

---

## 🧑‍💻 Getting Started

### ⚙️ Prerequisites

- [Node.js](https://nodejs.org/en/) (for running local development server)
- Any modern browser (for static serving)

### 🚀 Installation & Running Locally

# Clone the repository
git clone https://github.com/Vishal-Sonwane-2004/programming-quiz-hosted.git
cd programming-quiz-hosted

# Install live server globally if needed
npm install -g live-server
npm install

# Navigate to public directory and start
cd client/public
live-server
Alternatively, open client/public/index.html manually in a browser.


make sure before running you have configured these credentials in .env file   
This project has been switched to MySQL, so configure a local or hosted MySQL connection below.  

SESSION_SECRET=ADDYOURSESSIONKEY
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=yourpassword
MYSQL_DATABASE=yourdbname
PORT=3000


📚 User Guide
1. 🔐 Registration & Login
Go to Sign Up page → enter name, email, and password

After login, you'll land on the Dashboard

Reset password via Forgot Password link if needed

2. 🧭 Navigation
Navbar gives quick access to: Home, Profile, Quiz, Login, Signup

Profile icon leads to user details and performance data

3. 📝 Taking a Quiz
Choose a quiz category like Java, C++, Python, etc.

Answer each question; your score updates as you progress

4. 📊 Tracking Performance
View your recent quiz results in the Profile section

Performance data is stored per session

5. 🌓 Dark Mode
Use toggle button in navbar to switch between Light and Dark mode

Preferences are saved locally

6. 🔗 External Links
Footer has all your developer and social links

Click icons to open them in a new tab

🤝 Contributing
Contributions are welcome! To contribute:

Fork the repo

Create a branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add feature')

Push to your branch (git push origin feature/AmazingFeature)

Open a Pull Request