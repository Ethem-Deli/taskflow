# TaskFlow
A Team Task & Project Tracker

TaskFlow is a lightweight web-based project and task management application designed for small teams, students, and developers who want a simple way to organize projects and track progress.
The application allows users to create projects, manage tasks, assign work to team members, and track progress using a visual workflow similar to tools like Trello or Asana.
This project is being developed as part of the CSE 499 Senior Project and demonstrates modern web development practices using a full-stack JavaScript framework.

Purpose
Many small teams and students struggle to manage their tasks and projects effectively. While professional tools such as Jira, Asana, and Monday.com offer many features, they are often too complex or expensive for smaller teams.
TaskFlow solves this problem by providing a simple, intuitive, and lightweight project management tool that focuses on the most essential features needed to organize work and track progress.
The goal of this project is to:
Help teams stay organized
Track tasks and project progress
Provide a clear visual workflow
Demonstrate modern web development skills

Core Features

User Authentication
Secure user registration
User login and session management

Project Management
Create and manage multiple projects
View project details and progress

Task Management
Create tasks within projects
Assign tasks to team members
Update task status
Due Dates & Status Tracking
Set deadlines for tasks
Track task progress
Kanban Board

Visual task workflow:
To Do
In Progress
Done

Tasks can move between stages as work progresses.
Personal Dashboard

Users can see:
All tasks assigned to them
Upcoming deadlines
Project activity
Enhancements (Planned Features)
These features will be implemented if time allows:
Email or in-app task notifications
Task comments for collaboration
Search and filtering for tasks and projects
Progress visualization using charts
Mobile-friendly responsive design

Technology Stack
Frontend
Next.js
A modern React framework used to build the user interface and manage both frontend and backend functionality.
Tailwind CSS
Used to create a clean and responsive user interface.
Backend
Next.js API Routes
Server-side logic will be handled using Next.js API routes to manage authentication, projects, and tasks.

Database
SQLite
A lightweight database used to store:
Users
Projects
Tasks
Authentication
NextAuth.js
Provides secure authentication and session management.

Development Tools
GitHub
Used for version control and collaboration.

Microsoft Teams
Used for team communication and weekly project meetings.

Project Structure
taskflow
│
├── public
│
├── src
│   ├── app
│   │   ├── page.js
│   │   ├── dashboard
│   │   ├── projects
│   │   └── tasks
│   │
│   ├── components
│   │   ├── Navbar
│   │   ├── TaskCard
│   │   └── KanbanBoard
│   │
│   ├── lib
│   │   ├── db.js
│   │   └── auth.js
│   │
│   ├── models
│   │   ├── User.js
│   │   ├── Project.js
│   │   └── Task.js
│   │
│   └── api
│       ├── auth
│       ├── projects
│       └── tasks
│
└── README.md

Getting Started
1. Clone the Repository
git clone https://github.com/your-username/taskflow.git
Move into the project folder:
cd taskflow
2. Install Dependencies
npm install
3. Run the Development Server
npm run dev

Open your browser and visit:

http://localhost:3000
Development Plan
The project will be developed in weekly sprints.

Sprint 1
Project setup and authentication system.

Sprint 2
Project and task creation functionality.

Sprint 3
Kanban board and dashboard.

Sprint 4
Enhancements, testing, and UI improvements.

Team Members
Project Leader
Ethem Deli

Team Members
Douglas Greyling

Weekly Meeting Time
Thursday
16:00 UTC
(20:00 GMT+3)

Project Goals
By the end of the project, the team aims to deliver a fully functional task management application that allows teams to:
Organize projects
Assign tasks
Track progress visually
Collaborate efficiently

License
This project is developed for educational purposes as part of the CSE 499 Software Development Program.