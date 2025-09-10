# replit.md

## Overview

This is a video learning platform built for students in Ghana, featuring educational content with pay-per-video access. The platform allows students to purchase and watch educational videos covering subjects like Mathematics, Physics, Chemistry, and Biology. It integrates with Paystack for payments and Firebase for authentication and user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React + TypeScript**: Modern React application with TypeScript for type safety
- **Vite**: Fast build tool for development and production builds
- **TailwindCSS + shadcn/ui**: Utility-first CSS framework with a comprehensive component library
- **React Router (Wouter)**: Lightweight client-side routing
- **TanStack Query**: Server state management and data fetching
- **React Hook Form**: Form handling with validation

### Backend Architecture
- **Express.js**: RESTful API server built on Node.js
- **TypeScript**: Full-stack type safety with shared types
- **Memory Storage**: In-memory data storage for development (designed to be replaced with PostgreSQL)
- **Drizzle ORM**: Type-safe database operations configured for PostgreSQL

### Database Design
- **Users**: Store user authentication data, spending statistics, and video watching metrics
- **Videos**: Educational content metadata including pricing, duration, and subject categorization
- **Payments**: Transaction records with Paystack integration for payment verification
- **Video Access**: Time-limited access control linking users to purchased videos

### Authentication & Authorization
- **Firebase Authentication**: User registration and login with email/password
- **Firestore**: User data persistence and real-time synchronization
- **Session-based Access**: Time-limited video access (24 hours) after successful payment

### Payment Processing
- **Paystack Integration**: Nigerian payment gateway for local currency (NGN) transactions
- **Payment Verification**: Server-side verification of payment transactions
- **Access Control**: Automatic video access granting upon successful payment verification

## External Dependencies

### Payment Services
- **Paystack**: Primary payment processor for NGN transactions, handles credit/debit cards and bank transfers

### Authentication & Database
- **Firebase**: Authentication service and real-time database for user management
- **Firestore**: NoSQL document database for user data and application state

### Media Services
- **External Video Hosting**: Videos served from external URLs (placeholder implementation ready for CDN integration)

### Development Tools
- **Neon Database**: PostgreSQL-compatible serverless database (configured but not yet implemented)
- **Replit**: Development environment with hot-reload and runtime error handling

### UI Components
- **Radix UI**: Accessible component primitives for complex UI interactions
- **Lucide React**: Icon library for consistent iconography
- **Embla Carousel**: Touch-friendly carousel component for video browsing