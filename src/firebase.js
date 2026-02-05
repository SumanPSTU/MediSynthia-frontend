// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjth5WUGCscA94A3E4aQXmJYNMsb2dH2o",
  authDomain: "medisynthia-web-app-main.firebaseapp.com",
  projectId: "medisynthia-web-app-main",
  storageBucket: "medisynthia-web-app-main.firebasestorage.app",
  messagingSenderId: "923983074941",
  appId: "1:323983074941:web:1e93be92e9d777e96b8314",
  measurementId: "G-9DNGQCSYC0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };