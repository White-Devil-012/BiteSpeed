# Bitespeed Identity Reconciliation Service

A Node.js/TypeScript web service that implements identity reconciliation for customer contact information. This service helps identify and link customer contacts across multiple purchases using different email addresses and phone numbers.

## 🚀 Live Demo

**Local Development:** `http://localhost:3000/identify`
**Hosted Endpoint:** Ready for deployment to Render.com, Heroku, or any Node.js hosting platform

## 📋 Table of Contents

- [Problem Statement](#problem-statement)
- [Solution Overview](#solution-overview)
- [API Documentation](#api-documentation)
- [Installation & Setup](#installation--setup)
- [Usage Examples](#usage-examples)
- [Database Schema](#database-schema)
- [Architecture](#architecture)
- [Testing](#testing)
- [Deployment](#deployment)

## 🎯 Problem Statement

FluxKart.com needs to identify when different orders are made by the same customer using different contact information. The challenge is to link these contacts intelligently while maintaining a clear primary-secondary relationship.

## 💡 Solution Overview

The service implements an intelligent identity reconciliation system that:

1. **Links contacts** by matching email addresses or phone numbers
2. **Maintains hierarchy** with primary and secondary contact relationships
3. **Handles merging** when separate contact chains need to be linked
4. **Creates new contacts** when new information is provided
5. **Converts primaries to secondaries** when contact chains merge

## 📚 API Documentation

### POST /identify

Identifies and consolidates customer contact information.

**Request Body:**

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Response:**

```json
{
  "contact": {
    "primaryContatctId": "number",
    "emails": ["string[]"],
    "phoneNumbers": ["string[]"],
    "secondaryContactIds": ["number[]"]
  }
}
```

**Status Codes:**

- `200` - Success
- `400` - Bad Request (validation errors)
- `500` - Internal Server Error

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "OK",
  "timestamp": "2023-04-20T05:30:00.000Z",
  "service": "Bitespeed Identity Reconciliation"
}
```

## 🛠 Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- SQLite3

### Local Development

1. **Clone the repository:**

```bash
git clone <repository-url>
cd bitespeed-identity-reconciliation
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
# Copy and modify the environment file
cp .env.example .env
```

4. **Build the project:**

```bash
npm run build
```

5. **Start the development server:**

```bash
npm run dev
```

6. **Or start the production server:**

```bash
npm start
```

The server will start on `http://localhost:3000`

## 📖 Usage Examples

### Example 1: New Customer

**Request:**

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "lorraine@hillvalley.edu", "phoneNumber": "123456"}'
```

**Response:**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

### Example 2: Linking Existing Contact

**Request:**

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "mcfly@hillvalley.edu", "phoneNumber": "123456"}'
```

**Response:**

```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": [23]
  }
}
```

### Example 3: Primary Contact Merging

When two separate primary contacts need to be linked:

**Request:**

```bash
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "george@hillvalley.edu", "phoneNumber": "717171"}'
```

This will merge separate contact chains and convert newer primaries to secondaries.

## 🗄 Database Schema

```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phoneNumber TEXT,
  email TEXT,
  linkedId INTEGER,
  linkPrecedence TEXT CHECK(linkPrecedence IN ('primary', 'secondary')) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  deletedAt DATETIME,
  FOREIGN KEY (linkedId) REFERENCES contacts (id)
);
```

## 🏗 Architecture

```
src/
├── types/           # TypeScript type definitions
│   └── Contact.ts
├── database/        # Database layer
│   └── Database.ts
├── services/        # Business logic
│   └── IdentityService.ts
├── routes/          # API routes
│   └── identify.ts
└── index.ts         # Application entry point
```

### Key Components:

1. **Database Layer** (`Database.ts`): Handles all SQLite operations with proper error handling
2. **Identity Service** (`IdentityService.ts`): Core business logic for contact reconciliation
3. **API Routes** (`identify.ts`): Express routes with validation and error handling
4. **Type Definitions** (`Contact.ts`): TypeScript interfaces for type safety

## 🧪 Testing

### Manual Testing

Test the service with curl commands or a tool like Postman:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test identify endpoint
curl -X POST http://localhost:3000/identify \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phoneNumber": "1234567890"}'
```

### Test Scenarios

1. **New contact creation**
2. **Contact linking by email**
3. **Contact linking by phone**
4. **Primary contact merging**
5. **Edge cases with null values**

## 🚀 Deployment

### Deploy to Render.com (Free)

1. **Push code to GitHub**
2. **Connect to Render:**

   - Go to [render.com](https://render.com)
   - Create new Web Service
   - Connect your GitHub repository

3. **Configure build settings:**

   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node

4. **Set environment variables:**

   - `NODE_ENV=production`
   - `DATABASE_PATH=./contacts.db`

5. **Deploy and test**

## 🔧 Environment Variables

```bash
PORT=3000                    # Server port
NODE_ENV=development         # Environment
DATABASE_PATH=./contacts.db  # SQLite database path
```

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Piyush Kumar**

## 🆘 Support

For issues and questions:

1. Check the GitHub issues
2. Create a new issue with detailed description
3. Include request/response examples for bugs

---

**Note:** This service implements the exact requirements specified in the Bitespeed Backend Task for Identity Reconciliation. All edge cases and scenarios mentioned in the task have been handled.
