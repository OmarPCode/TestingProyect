# TestingProyect

This GitHub repository serves as a practice project during the course. It is designed to help with learning various practices for a Node.js-based project using TypeScript. The project includes several configurations, settings, and workflows to manage the repository, perform tests, and enforce coding standards.

## Description

TestingProyect is a Node.js-based application that demonstrates various software development practices such as unit testing, code linting, and enforcing commit message conventions. This project includes a simple "Hello World" program and uses GitHub Actions to automate continuous integration (CI) tasks such as running tests, checking code style, and ensuring proper commit messages.

## Tools Used

- **Node.js**: JavaScript runtime used for server-side development.
- **TypeScript**: Superset of JavaScript that provides static typing.
- **GitHub Actions**: CI/CD tool for automating workflows like testing, linting, and commit message validation.
- **Jest**: Testing framework for running unit and integration tests.
- **ESLint**: Linting tool for maintaining code quality.
- **Danger**: Tool for automating pull request checks (e.g., commit messages).
- **Pre-commit Hooks**: Hooks for ensuring code quality before committing.
- **MongoDB (optional)**: In-memory database used for integration testing (via MongoMemoryServer).

## Requirements

- **Node.js**: Version 16 or higher.
- **npm**: Node package manager (comes with Node.js).
- **MongoDB** (for integration tests only): MongoDB is used for testing purposes; however, the application can run without it in certain environments.

## How to Run/Start the App

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/TestingProyect.git
   cd TestingProyect

## Steps to run the project:
- npm install
- npm run start
- Same steps to run the backend and frontend at the same time for system tests

  
- npm run test
- npm run test:coverage
- npm run system:(especific test) - example npm run system:deliveries
