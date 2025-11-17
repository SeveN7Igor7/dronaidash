import { initializeApp } from "firebase/app"
import { getDatabase } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyDn6a3JPuVMIBzsg54pYEx_wXddNUc-JRM",
  authDomain: "agrotrace-adb55.firebaseapp.com",
  databaseURL: "https://agrotrace-adb55-default-rtdb.firebaseio.com",
  projectId: "agrotrace-adb55",
  storageBucket: "agrotrace-adb55.firebasestorage.app",
  messagingSenderId: "115514732613",
  appId: "1:115514732613:web:d3f71f7f6fbc0cf6f7b32c",
}

const app = initializeApp(firebaseConfig)
export const database = getDatabase(app)
