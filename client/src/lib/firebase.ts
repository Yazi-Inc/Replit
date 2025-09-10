import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC3Rh4B4p0MqOJJMh2t-uCQv7UGcHjv29A",
  authDomain: "gis-project-435913.firebaseapp.com",
  projectId: "gis-project-435913",
  storageBucket: "gis-project-435913.appspot.com",
  messagingSenderId: "555954816336",
  appId: "1:555954816336:web:d50a6dc897196f66d0d855"
};

// const firebaseConfig = {
//   apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-api-key",
//   authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "gis-video-platform"}.firebaseapp.com`,
//   projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "gis-video-platform",
//   storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "gis-video-platform"}.appspot.com`,
//   messagingSenderId: "123456789012",
//   appId: import.meta.env.VITE_FIREBASE_APP_ID || "demo-app-id",
// };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Disable emulators for production - use real Firebase
// Connect to emulators only in local development
// if (import.meta.env.DEV && window.location.hostname === "localhost") {
//   try {
//     if (!auth.emulatorConfig) {
//       connectAuthEmulator(auth, "http://localhost:9099");
//     }
//   } catch (error) {
//     console.log("Auth emulator connection failed:", error);
//   }

//   try {
//     connectFirestoreEmulator(db, "localhost", 8080);
//   } catch (error) {
//     console.log("Firestore emulator connection failed:", error);
//   }
// }

export default app;
