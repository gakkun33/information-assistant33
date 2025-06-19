
import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const firebaseConfig = {
  apiKey: "AIzaSyB1kZl3nvohEa35-lv6LPIm2brWRxTn4f0",
  authDomain: "infomation-assistant33.firebaseapp.com",
  projectId: "infomation-assistant33",
  storageBucket: "infomation-assistant33.firebasestorage.app",
  messagingSenderId: "993568139699",
  appId: "1:993568139699:web:23dfba10652490661f03c6"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  return (
    <div className="p-4 text-xl">Link Manager App Ready. Please configure Firebase and add logic.</div>
  );
}
