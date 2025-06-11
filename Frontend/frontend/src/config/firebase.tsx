import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
const firebaseConfig = {
  apiKey: "AIzaSyC1TyBaoI10D2jIx_P0xS4nUwy9qL4Jvao",
  authDomain: "code1v1authentication.firebaseapp.com",
  projectId: "code1v1authentication",
  storageBucket: "code1v1authentication.firebasestorage.app",
  messagingSenderId: "726688198821",
  appId: "1:726688198821:web:5d44dbd27681ab43335d4c",
  measurementId: "G-6WL9EF80FN"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const email = "";
const password = "";
export const auth = getAuth(app);
createUserWithEmailAndPassword(auth, email, password).then((userCredential) => {
    const user = userCredential.user;
}).catch((error) => {
    const errorCode = error.code;
    const errorMessage = error.message;
});


