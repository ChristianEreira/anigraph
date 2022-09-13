// Configure Firebase and stylesheet
import { initializeApp } from "firebase/app";
import "./style.scss";

const firebaseConfig = {
    apiKey: "AIzaSyAZeqlDNesgaQFr82524usl9kQsdN6hkOg",
    authDomain: "anaph123.firebaseapp.com",
    projectId: "anaph123",
    storageBucket: "anaph123.appspot.com",
    messagingSenderId: "78153046667",
    appId: "1:78153046667:web:75584f99d55e0b54d7128e",
    measurementId: "G-WE7T5CH1VH"
  };

  export const app = initializeApp(firebaseConfig);