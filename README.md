# GIS Video Learning Platform

A premium video learning platform for Ghana International School featuring pay-per-video access with 24-hour viewing windows. Built with React, TypeScript, Firebase, and Paystack for secure payments in Ghana Cedis (GHS).

## Features

- 🔐 **Google Sign-In Authentication** - Secure user authentication via Firebase
- 💳 **Paystack Payment Integration** - Accept payments in Ghana Cedis (GHS)
- ⏰ **24-Hour Access System** - Time-limited video access after payment
- 📊 **User Dashboard** - Payment history, spending statistics, and active access tracking
- 🎥 **Secure Video Streaming** - Protected video content with access control
- 📱 **Responsive Design** - Mobile and desktop optimized interface

## Tech Stack

- **Frontend:** React 18, TypeScript, TailwindCSS, shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** Firebase Firestore
- **Authentication:** Firebase Auth (Google Sign-In)
- **Payments:** Paystack API
- **Build Tool:** Vite
- **Deployment:** Google Cloud Run ready

## Prerequisites

Before running this application, ensure you have:

- Node.js 18+ installed
- Firebase project with Firestore and Authentication enabled
- Paystack account for payment processing
- Google OAuth credentials configured in Firebase

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id

# Paystack Configuration
VITE_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key

# Application Configuration
PORT=5000
NODE_ENV=development
```

## Firebase Setup

1. **Create a Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Enable Firestore Database
   - Enable Authentication with Google provider

2. **Firestore Security Rules:**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own data
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Users can read/write their own payments
       match /payments/{paymentId} {
         allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
       }
       
       // Users can read/write their own video access
       match /videoAccess/{accessId} {
         allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
       }
       
       // Videos are readable by all authenticated users
       match /videos/{videoId} {
         allow read: if request.auth != null;
       }
     }
   }
   ```

3. **Configure Google Authentication:**
   - In Firebase Console, go to Authentication > Sign-in method
   - Enable Google provider
   - Add your domain to authorized domains

## Paystack Setup

1. **Create Paystack Account:**
   - Sign up at [Paystack](https://paystack.com/)
   - Get your test/live API keys
   - Configure webhook URL (optional)

2. **Test Payments:**
   - Use Paystack test card: `4084 0840 8408 4081`
   - CVV: `408`
   - Expiry: Any future date
   - PIN: `0000`

## Local Development

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd gis-video-platform
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your actual credentials
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:5000
   ```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking

## Deployment to Google Cloud Run

### Prerequisites

- Google Cloud CLI installed
- Docker installed
- Google Cloud project with billing enabled
- Cloud Run API enabled

### Deployment Steps

1. **Build and push Docker image:**
   ```bash
   # Set your project variables
   export PROJECT_ID=your-gcp-project-id
   export SERVICE_NAME=gis-video-platform
   export REGION=us-central1

   # Build and push to Google Container Registry
   docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME .
   docker push gcr.io/$PROJECT_ID/$SERVICE_NAME
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy $SERVICE_NAME \
     --image gcr.io/$PROJECT_ID/$SERVICE_NAME \
     --platform managed \
     --region $REGION \
     --allow-unauthenticated \
     --set-env-vars NODE_ENV=production \
     --set-env-vars VITE_FIREBASE_API_KEY=your_api_key \
     --set-env-vars VITE_FIREBASE_PROJECT_ID=your_project_id \
     --set-env-vars VITE_FIREBASE_APP_ID=your_app_id \
     --set-env-vars VITE_PAYSTACK_PUBLIC_KEY=your_public_key \
     --set-env-vars PAYSTACK_SECRET_KEY=your_secret_key \
     --port 5000 \
     --memory 512Mi \
     --cpu 1
   ```

3. **Configure custom domain (optional):**
   ```bash
   gcloud run domain-mappings create \
     --service $SERVICE_NAME \
     --domain your-domain.com \
     --region $REGION
   ```

### Using Cloud Build (Automated)

Create `cloudbuild.yaml`:

```yaml
steps:
  # Build the container image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/gis-video-platform', '.']
  
  # Push the container image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/gis-video-platform']
  
  # Deploy container image to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'gis-video-platform'
      - '--image'
      - 'gcr.io/$PROJECT_ID/gis-video-platform'
      - '--region'
      - 'us-central1'
      - '--platform'
      - 'managed'
      - '--allow-unauthenticated'

images:
  - 'gcr.io/$PROJECT_ID/gis-video-platform'
```

Deploy with:
```bash
gcloud builds submit --config cloudbuild.yaml
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility libraries (Firebase, Firestore)
│   │   └── pages/         # Page components
│   └── index.html
├── server/                # Backend Express server
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   └── vite.ts           # Vite integration
├── shared/               # Shared TypeScript types
├── Dockerfile           # Container configuration
├── package.json         # Dependencies and scripts
└── vite.config.ts       # Vite configuration
```

## Key Components

- **VideoPlayer**: Secure video streaming with access control
- **PaymentModal**: Paystack integration for GHS payments
- **AuthModal**: Google Sign-In authentication
- **UserDashboard**: Payment history and statistics
- **Firebase Integration**: Authentication and Firestore database
- **Payment Processing**: Paystack webhook verification

## Security Features

- Firebase Authentication with Google Sign-In
- Firestore security rules for data protection
- Environment variables for sensitive credentials
- Payment verification through Paystack webhooks
- Time-based access control (24-hour expiry)

## Troubleshooting

### Common Issues

1. **Firebase Connection Errors:**
   - Verify Firebase configuration in `.env`
   - Check Firestore security rules
   - Ensure Firebase APIs are enabled

2. **Payment Failures:**
   - Verify Paystack API keys
   - Check webhook configuration
   - Test with Paystack test cards

3. **Build Errors:**
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all dependencies are installed

### Support

For technical support or questions:
- Check Firebase documentation
- Review Paystack API documentation
- Verify Google Cloud Run deployment guides

## License

This project is proprietary software for Ghana International School.

---

© 2024 Ghana International School. All rights reserved.