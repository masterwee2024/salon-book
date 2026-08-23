import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  projectId: "gen-lang-client-0119587405",
  appId: "1:371074782559:web:323d199c4daebc068bd2ea",
  apiKey: "AIzaSyClg-5N7AsXQhI0cxQ4JWR9-Sjdc0ySQ8Y",
  authDomain: "gen-lang-client-0119587405.firebaseapp.com",
  storageBucket: "gen-lang-client-0119587405.firebasestorage.app",
  messagingSenderId: "371074782559",
  measurementId: "",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-6a505868-a15f-4a30-8b28-5c85f89fda45");
