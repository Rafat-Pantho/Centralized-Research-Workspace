# Centralized Research Workspace (CRW)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Status](https://img.shields.io/badge/status-in--development-yellow)

## Project Summary

**Centralized Research Workspace (CRW)** is an all-in-one web platform built to eliminate the *"app-switching fatigue"* that academic researchers face when juggling separate tools for literature review, task management, manuscript drafting, and meeting notes.

CRW consolidates these workflows into a single collaborative workspace, allowing research teams to:

- Manage and annotate literature/paper repositories collaboratively.
- Track project tasks and their progress within a workspace.
- Draft and version academic manuscripts.
- Log meeting minutes and key decisions.
- Organize members and permissions per research workspace.

## Tech Stack

| Layer        | Technologies                                              |
|--------------|-------------------------------------------------------------|
| **Backend**  | Java 17, Spring Boot 3, Spring Data JPA, Spring Security (JWT), H2 Database |
| **Frontend** | React.js, Vite, Axios, React Router                        |

## Team

**Team Name:** noWayHome
**Course:** Web Architecture - CSE 4636

| Name              | Student ID |
|-------------------|------------|
| Rafat Abdullah    | 220041102  |
| Mahiul Kabir      | 220041109  |
| Sohom Sattyam     | 220041141  |

## Features Showcase

| Dashboard | Literature Management | Manuscript Development |
|-----------|------------------------|--------------------------|
| ![Dashboard](screenshots/dashboard.png) | ![Literature](screenshots/literature.png) | ![Manuscript](screenshots/manuscript.png) |

## Getting Started

### Prerequisites

- Java 17+
- Maven 3.9+
- Node.js 18+ and npm

### Backend Setup (Spring Boot)

```bash
cd CRW-backend
mvn clean install
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`.

### Frontend Setup (React + Vite)

```bash
cd CRW-frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

## Repository

[https://github.com/Rafat-Pantho/Centralized-Research-Workspace](https://github.com/Rafat-Pantho/Centralized-Research-Workspace)
