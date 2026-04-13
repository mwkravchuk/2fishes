# Coffee Roaster Ecommerce Platform

A production-oriented ecommerce platform built for a coffee roasting business, designed to support real customer orders with a focus on simplicity, reliability, and clean system design.

## Overview

This project implements a full purchase flow from product browsing to checkout and order confirmation. It was built with the goal of creating a system I would feel confident deploying for real users, emphasizing correctness, validation, and maintainability over unnecessary complexity.

## Tech Stack

- **Frontend:** Next.js + Tailwind CSS  
- **Backend:** Next.js API routes / server actions  
- **Database:** PostgreSQL (Neon)  
- **ORM:** Prisma  
- **Payments:** Stripe  
- **Email:** Resend  

## Key Features

- Product browsing and selection
- Cart and checkout flow
- Secure Stripe payment integration
- User authentication and session management
- Order lifecycle handling (creation → checkout → confirmation)
- Input validation and error handling to prevent invalid states
- Admin functionality (in progress)

## Design Focus

This project prioritizes:

- **Simplicity:** Avoiding overengineering while maintaining a clean structure  
- **Reliability:** Ensuring valid application states and handling edge cases  
- **Real-world usability:** Building something suitable for actual customer interaction  

## Local Development

```bash
npm install
npm run dev
```

Create a .env with the following variables:
<<<<<<< HEAD
DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, NEXT_PUBLIC_APP_URL
=======
DATABASE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
>>>>>>> 935e6cbff34557f4d5e3a8139a3684a8bf85d05a
