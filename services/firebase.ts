import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, set, onValue, push, remove, update, get, query, orderByChild, equalTo, orderByKey, limitToFirst, limitToLast } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDs24Aac7yMQqPV3HSWZ-pHNXyhOc60JtE",
  authDomain: "medwork-537b4.firebaseapp.com",
  databaseURL: "https://medwork-537b4-default-rtdb.firebaseio.com",
  projectId: "medwork-537b4",
  storageBucket: "medwork-537b4.firebasestorage.app",
  messagingSenderId: "21677946160",
  appId: "1:21677946160:web:1a339265b3a8ed707444f5",
  measurementId: "G-M54BP3LH5K"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const rtdb = getDatabase(app);

// Экспортируем только функции Realtime Database
export { 
  signInAnonymously,
  ref, set, onValue, push, remove, update, get, query, orderByChild, equalTo, orderByKey, limitToFirst, limitToLast
};