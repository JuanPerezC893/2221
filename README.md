# Waste Management System (MVP)

This document provides instructions on how to setup and run the development environment for the Waste Management System MVP, including the backend, frontend, and database.

## Table of Contents
1. [Project Structure](#project-structure)
2. [System Architecture](#system-architecture)
3. [Prerequisites](#prerequisites)
4. [Database Setup](#database-setup)
5. [Backend Setup and Run](#backend-setup-and-run)
6. [Frontend Setup and Run](#frontend-setup-and-run)
7. [CSS Modification](#css-modification)

## 1. Project Structure

```
C:\Users\albon\OneDrive\Escritorio\Gestion de residuos\
├───PromptP.txt
├───Propuesta.txt
├───backend\
│   ├───database.sql
│   ├───db.js
│   ├───index.js
│   ├───package-lock.json
│   ├───package.json
│   ├───node_modules\...
│   └───routes\
│       ├───auth.js
│       ├───proyectos.js
│       └───residuos.js
└───frontend\
    ├───.gitignore
    ├───eslint.config.js
    ├───index.html
    ├───package-lock.json
    ├───package.json
    ├───README.md
    ├───vite.config.js
    ├───node_modules\...
    ├───public\
    │   └───vite.svg
    └───src\
        ├───App.css
        ├───App.jsx
        ├───index.css
        ├───main.jsx
        ├───assets\
        │   └───react.svg
        ├───components\
        │   ├───AddWaste.jsx
        │   ├───Dashboard.jsx
        │   ├───EditProject.jsx
        │   ├───EditWaste.jsx
        │   ├───Layout.jsx
        │   ├───Login.jsx
        │   ├───Navbar.jsx
        │   ├───PrivateRoute.jsx
        │   ├───Register.jsx
        │   └───WasteList.jsx
        └───context\
            └───AuthContext.jsx

*   **Node.js** (LTS version recommended)
*   **npm** (comes with Node.js)
*   **PostgreSQL**
*   **Git** (optional, for version control)

## 3. Database Setup

1.  **Create a PostgreSQL database:**
    ```bash
    psql -U your_username -c "CREATE DATABASE waste_management;"
    ```
    Replace `your_username` with your PostgreSQL username.

2.  **Restore the database from the dump:**
    ```bash
    psql -U your_username -d waste_management -f backend/database.sql
    ```
    This will create and populate the necessary tables in your `waste_management` database.

3.  **Configure database connection:**
    Create a `.env` file in the `backend` directory with the following content:
    ```
    DB_USER=your_username
    DB_HOST=localhost
    DB_DATABASE=waste_management
    DB_PASSWORD=your_password
    DB_PORT=5432
    JWT_SECRET=your_jwt_secret
    ```
    Replace `your_username`, `your_password` and `your_jwt_secret` with your actual credentials.

## 4. Backend Setup and Run

The backend is a Node.js application.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the backend server:**
    ```bash
    npm start
    # or
    node index.js
    ```
    The backend server should start on `http://localhost:5000` (or the port defined in `index.js`).

## 5. Frontend Setup and Run

The frontend is a React application built with Vite.

1.  **Navigate to the frontend directory:**
    ```bash
    cd frontend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the frontend development server:**
    ```bash
    npm run dev
    ```
    The frontend application should open in your browser, usually at `http://localhost:5173` (or another available port).

    **Note on Responsiveness:** The frontend is built with Bootstrap, which provides a robust foundation for responsive design. The application is designed to adapt to various screen sizes (mobile, tablet, desktop).

## 7. CSS Modification

The main CSS files for the frontend are located in the `frontend/src/` directory:

*   `frontend/src/App.css`: Contains general application-wide styles.
*   `frontend/src/index.css`: Contains global styles, often related to basic HTML elements and root variables.

**Important Considerations for CSS:**

*   **Specificity:** Be aware of CSS specificity when adding or modifying styles. More specific rules (e.g., targeting an ID) will override less specific rules (e.g., targeting a tag).
*   **Import Order:** In `frontend/src/main.jsx`, Bootstrap's CSS (`bootstrap/dist/css/bootstrap.min.css`) is imported before `index.css` and `App.css`. This means that styles defined in `index.css` and `App.css` will take precedence over Bootstrap's default styles if they have the same specificity.
*   **Avoid `!important`:** As a general rule, avoid using `!important` in your CSS unless absolutely necessary, as it can make debugging and maintaining styles very difficult.
*   **Browser Cache:** During development, if you make CSS changes and they don't appear, try a hard refresh of your browser (Ctrl+Shift+R or Cmd+Shift+R) or clear your browser's cache. Sometimes, restarting the frontend development server (`npm run dev`) can also help.
