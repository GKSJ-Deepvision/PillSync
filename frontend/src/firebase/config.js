import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyDt-H2RksLuWG-LQwOfI8x-nJzqb3pMNek",
  authDomain: "pillsync-61b6a.firebaseapp.com",
  projectId: "pillsync-61b6a",
  storageBucket: "pillsync-61b6a.firebasestorage.app",
  messagingSenderId: "155859802489",
  appId: "1:155859802489:web:f20cc7a2f44e5a22a137a8",
};

const app = initializeApp(firebaseConfig);

export default app;