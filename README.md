# ShopNest E-commerce API

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

ShopNest is a robust and scalable backend for an e-commerce platform, built with the NestJS framework. It provides a comprehensive set of features for managing products, users, orders, and payments, with a strong emphasis on modern development practices.

## Core Features

- **User Authentication & Authorization:**
  - Secure user registration and login functionality.
  - JSON Web Token (JWT) based authentication.
  - Role-based access control (RBAC) to protect routes and manage permissions (e.g., ADMIN, USER).
- **Product Management:**
  - Full CRUD (Create, Read, Update, Delete) operations for products.
  - Advanced product search and filtering capabilities.
  - Support for product specifications and variations.
- **Shopping Cart:**
  - Persistent shopping cart functionality for users.
  - Add, update, and remove items from the cart.
- **Order Management:**
  - Create and manage customer orders.
  - Track order status and history.
- **Payment Processing (Simulated):**
  - Integration points for payment gateways (currently simulated).
- **API Documentation:**
  - Automatically generated and interactive API documentation using Swagger (OpenAPI).
- **Input Validation:**
  - Robust request data validation using `class-validator` and `class-transformer` to ensure data integrity.
- **Database:**
  - Uses Prisma ORM for efficient and type-safe database interactions.

## Technologies Used

- **Framework:** [NestJS](https://nestjs.com/) (v11.x)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Database:** [SQLite](https://www.sqlite.org/index.html) (for development, easily configurable for PostgreSQL, MySQL, etc.)
- **Authentication:** JSON Web Tokens (JWT), Custom Guards
- **API Documentation:** Swagger (OpenAPI) via `@nestjs/swagger`
- **Validation:** `class-validator`, `class-transformer`
- **Package Manager:** [pnpm](https://pnpm.io/)

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (v8 or higher recommended)

## Getting Started

### 1. Clone the Repository

```bash
# If you haven't cloned it yet:
git clone https://github.com/Raylandson/shopnest.git
cd shopnest
```

### 2. Install Dependencies

Install all project dependencies using pnpm:

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory of the project. You can copy from `.env.example` if one exists, or create it manually. This file will store your application's configuration secrets.

**Example `.env` structure:**

```env
# .env

# Database URL (Prisma uses this to connect to your database)
# For SQLite (default development):
DATABASE_URL="file:./dev.db"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-please-change-this"
JWT_EXPIRATION_TIME="3600s" # e.g., 1 hour (1h), 1 day (1d)

# Server Port (Optional, defaults to 3000)
# SERVER_PORT=3000
```

**Important:**

- Ensure your `DATABASE_URL` in the `.env` file correctly points to your database. For the default SQLite setup, it typically points to a file within the `prisma` directory.
- Change `JWT_SECRET` to a strong, unique secret key.

### 4. Prisma Database Setup

Apply database migrations to set up your database schema. This command will also generate the Prisma Client based on your `prisma/schema.prisma` file.

```bash
pnpm prisma migrate dev
```

This will create the `dev.db` SQLite file in the `prisma` directory if it doesn't exist and apply all migrations.

## Running the Application

### Development Mode

To run the application in development mode with hot-reloading enabled (rebuilds on file changes):

```bash
pnpm run start:dev
```

The application will typically be available at `http://localhost:3000` (or the port specified in your `.env` file).

### Production Mode

To build and run the application optimized for production:

```bash
# 1. Build the application
pnpm run build

# 2. Start the production server
pnpm run start:prod
```

### Watch Mode (Alternative to `start:dev`)

To run the application in watch mode (restarts on file changes without full hot-reloading features of `start:dev`):

```bash
pnpm run start
```

## API Documentation (Swagger)

Once the application is running, you can access the interactive Swagger UI for API documentation.
By default, it's available at:

[http://localhost:3000/api-docs](http://localhost:3000/api-docs)

This interface allows you to view all available endpoints, their request/response schemas, and even try them out directly from your browser.

## Running Tests

### Unit Tests

To execute all unit tests defined in the project:

```bash
pnpm run test
```

### End-to-End (E2E) Tests

Ensure the application (or a dedicated test instance with its own database) is running before executing E2E tests.

```bash
pnpm run test:e2e
```

### Test Coverage

To generate a test coverage report:

```bash
pnpm run test:cov
```

The report will typically be saved in a `coverage` directory.

## Database Operations with Prisma

### Generating Prisma Client

If you manually change your `prisma/schema.prisma` file (e.g., add new models or fields), you need to regenerate the Prisma Client:

```bash
pnpm prisma generate
```

(Note: `pnpm prisma migrate dev` also runs `prisma generate` automatically.)

### Creating a New Migration

After making changes to your `prisma/schema.prisma` that require a database schema change:

```bash
pnpm prisma migrate dev --name your-descriptive-migration-name
```

### Resetting the Database (Development Only)

**Warning:** This command will delete all data in your database and re-apply all migrations. Use with extreme caution and only in development environments.

```bash
pnpm prisma migrate reset
```

You will likely be prompted to confirm this action.

### Prisma Studio (Database GUI)

Prisma comes with a built-in GUI to view and manage your data.

```bash
pnpm prisma studio
```

This will open Prisma Studio in your web browser.

## Project Structure Overview

```
/shopnest
├── prisma/                 # Prisma schema, migrations, and SQLite DB file (dev.db)
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── main.ts             # Application entry point, initializes NestJS app
│   ├── app.module.ts       # Root application module
│   ├── auth/               # Authentication module (controller, service, guards, DTOs)
│   ├── product/            # Product module
│   ├── cart/               # Shopping Cart module
│   ├── orders/             # Orders module
│   ├── payment/            # Payment module
│   ├── prisma/             # Prisma service module (for DI)
│   └── common/             # Common utilities, interfaces, decorators, DTOs
├── test/                   # Unit and E2E tests
├── .env                    # Environment variables (you need to create this)
├── eslint.config.mjs       # ESLint configuration
├── nest-cli.json           # NestJS CLI configuration
├── package.json            # Project dependencies and scripts
├── pnpm-lock.yaml          # PNPM lock file
├── tsconfig.build.json     # TypeScript configuration for builds
└── tsconfig.json           # Base TypeScript configuration
```
