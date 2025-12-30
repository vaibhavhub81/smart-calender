import { initializeApp } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
const firebaseConfig = {
  apiKey: "AIzaSyBigHHN6NWIwsSGrQLsofyu6lmOH-l9IIc",
  authDomain: "calender-app-9595c.firebaseapp.com",
  projectId: "calender-app-9595c",
  storageBucket: "calender-app-9595c.firebasestorage.app",
  messagingSenderId: "221349634692",
  appId: "1:221349634692:web:8c31f414b3b49259eed8d1"
};
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);