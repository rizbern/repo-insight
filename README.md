Currently, the project implements a basic in-memory user module to establish core backend concepts such as routing, validation, and CRUD operations.

---

## Tech Stack

- Node.js
- NestJS
- TypeScript
- class-validator
- class-transformer

---

## Project Structure

src/
modules/
user/
dto/
create-user.dto.ts
update-user.dto.ts
user.controller.ts
user.service.ts
user.module.ts


---

## Features Implemented

### User Module (In-Memory)

- Create user
- Get all users
- Get user by ID
- Update user
- Delete user

---

API ENDPOINT TEST:

GET http://localhost:3000/users

GET http://localhost:3000/users/1

POST http://localhost:3000/users
Content-Type: application/json
{
  "name": "Alice"
}

POST http://localhost:3000/users
Content-Type: application/json
{
  "name": 123
}

POST http://localhost:3000/users
Content-Type: application/json
{
  "name": ""
}

PUT http://localhost:3000/users/1
Content-Type: application/json
{
  "name": "UpdatedName"
}

PUT http://localhost:3000/users/1
Content-Type: application/json
{
  "name": ""
}

DELETE http://localhost:3000/users/1

GET http://localhost:3000/users/999


---

Setup Instructions:
Install dependencies
npm install
npm run start:dev
http://localhost:3000


Current Limitations
Data is stored in-memory (resets on server restart)
No database integration yet
No GitHub API integration yet

Next Steps
Integrate GitHub API
Store data in PostgreSQL
Add repository and commit tracking
Build analytics endpoints