import { initializeApp } from "firebase/app"
import { getFirestore, enableNetwork, disableNetwork } from "firebase/firestore"

// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCnpmDJaUUImVWa1pBLAPPjZwU0gdLdZ7Q",
  authDomain: "jewelry-inventory-app.firebaseapp.com",
  projectId: "jewelry-inventory-app",
  storageBucket: "jewelry-inventory-app.firebasestorage.app",
  messagingSenderId: "43773873172",
  appId: "1:43773873172:web:3fa4f68d7423a75ddc6b01",
  measurementId: "G-7N058CMCHT"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firestore with enhanced offline persistence
const db = getFirestore(app)

let isOffline = false
let networkListeners = []

const checkNetworkStatus = () => {
  return navigator.onLine
}

export const toggleOfflineMode = async (offline = false) => {
  try {
    if (offline && !isOffline) {
      await disableNetwork(db)
      isOffline = true
      console.log("Firebase offline mode enabled")
      notifyNetworkListeners({ online: false, syncing: false })
    } else if (!offline && isOffline) {
      await enableNetwork(db)
      isOffline = false
      console.log("Firebase online mode enabled")
      notifyNetworkListeners({ online: true, syncing: true })
    }
  } catch (error) {
    console.error("Error toggling offline mode:", error)
    throw error
  }
}

export const addNetworkListener = (callback) => {
  networkListeners.push(callback)
  // Immediately notify with current status
  callback({
    online: checkNetworkStatus() && !isOffline,
    syncing: checkNetworkStatus() && !isOffline,
  })
}

export const removeNetworkListener = (callback) => {
  networkListeners = networkListeners.filter((listener) => listener !== callback)
}

const notifyNetworkListeners = (status) => {
  networkListeners.forEach((listener) => listener(status))
}

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    if (isOffline) {
      toggleOfflineMode(false).catch(console.error)
    }
  })

  window.addEventListener("offline", () => {
    if (!isOffline) {
      toggleOfflineMode(true).catch(console.error)
    }
  })
}

export const getNetworkStatus = () => ({
  online: checkNetworkStatus() && !isOffline,
  syncing: checkNetworkStatus() && !isOffline,
  isOffline,
})
// comment
export { db }
export default app
// i am adding comment