import { collection, onSnapshot, query, orderBy, enableNetwork, disableNetwork } from "firebase/firestore"
import { db } from "./firebase.js"

// Collections for real-time sync
const COLLECTIONS = {
  INVENTORY: "inventory",
  CUSTOMERS: "customers",
  SALES: "sales",
}

// Active listeners storage
const activeListeners = new Map()
const syncCallbacks = new Map()

// Sync status management
const syncStatus = {
  inventory: { synced: false, lastSync: null, error: null },
  customers: { synced: false, lastSync: null, error: null },
  sales: { synced: false, lastSync: null, error: null },
}

// Real-time listener setup
export const setupRealtimeSync = (collectionName, callback, options = {}) => {
  try {
    // Remove existing listener if any
    if (activeListeners.has(collectionName)) {
      activeListeners.get(collectionName)()
      activeListeners.delete(collectionName)
    }

    // Create query with optional ordering
    let q = collection(db, collectionName)
    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || "desc"))
    }

    // Setup real-time listener
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Convert Firestore timestamps to JavaScript dates
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          saleDate: doc.data().saleDate?.toDate(),
        }))

        // Update sync status
        syncStatus[collectionName] = {
          synced: true,
          lastSync: new Date(),
          error: null,
          count: data.length,
        }

        // Notify callback with new data
        callback(data)

        // Notify sync status listeners
        notifySyncStatusListeners()

        console.log(`Real-time sync updated for ${collectionName}: ${data.length} items`)
      },
      (error) => {
        console.error(`Real-time sync error for ${collectionName}:`, error)

        // Update sync status with error
        syncStatus[collectionName] = {
          synced: false,
          lastSync: syncStatus[collectionName].lastSync,
          error: error.message,
        }

        // Notify sync status listeners
        notifySyncStatusListeners()
      },
    )

    // Store the unsubscribe function
    activeListeners.set(collectionName, unsubscribe)

    return unsubscribe
  } catch (error) {
    console.error(`Failed to setup real-time sync for ${collectionName}:`, error)
    throw error
  }
}

// Remove real-time listener
export const removeRealtimeSync = (collectionName) => {
  if (activeListeners.has(collectionName)) {
    activeListeners.get(collectionName)()
    activeListeners.delete(collectionName)

    // Reset sync status
    syncStatus[collectionName] = {
      synced: false,
      lastSync: null,
      error: null,
    }

    notifySyncStatusListeners()
    console.log(`Real-time sync removed for ${collectionName}`)
  }
}

// Setup all collection listeners
export const setupAllRealtimeSync = (callbacks) => {
  const { onInventoryUpdate, onCustomersUpdate, onSalesUpdate } = callbacks

  // Setup inventory sync
  if (onInventoryUpdate) {
    setupRealtimeSync(COLLECTIONS.INVENTORY, onInventoryUpdate, {
      orderBy: { field: "createdAt", direction: "desc" },
    })
  }

  // Setup customers sync
  if (onCustomersUpdate) {
    setupRealtimeSync(COLLECTIONS.CUSTOMERS, onCustomersUpdate, {
      orderBy: { field: "createdAt", direction: "desc" },
    })
  }

  // Setup sales sync
  if (onSalesUpdate) {
    setupRealtimeSync(COLLECTIONS.SALES, onSalesUpdate, {
      orderBy: { field: "saleDate", direction: "desc" },
    })
  }
}

// Remove all listeners
export const removeAllRealtimeSync = () => {
  Object.keys(COLLECTIONS).forEach((key) => {
    removeRealtimeSync(COLLECTIONS[key])
  })
}

// Sync status management
export const getSyncStatus = () => ({ ...syncStatus })

export const addSyncStatusListener = (callback) => {
  const id = Date.now() + Math.random()
  syncCallbacks.set(id, callback)

  // Immediately notify with current status
  callback(getSyncStatus())

  return id
}

export const removeSyncStatusListener = (id) => {
  syncCallbacks.delete(id)
}

const notifySyncStatusListeners = () => {
  const status = getSyncStatus()
  syncCallbacks.forEach((callback) => callback(status))
}

// Force sync refresh
export const forceSyncRefresh = async () => {
  try {
    // Temporarily disable and re-enable network to force sync
    await disableNetwork(db)
    await new Promise((resolve) => setTimeout(resolve, 100))
    await enableNetwork(db)

    console.log("Force sync refresh completed")
    return true
  } catch (error) {
    console.error("Force sync refresh failed:", error)
    throw error
  }
}

// Check if all collections are synced
export const isFullySynced = () => {
  return Object.values(syncStatus).every((status) => status.synced && !status.error)
}

// Get sync summary
export const getSyncSummary = () => {
  const statuses = Object.entries(syncStatus)
  const synced = statuses.filter(([_, status]) => status.synced).length
  const total = statuses.length
  const hasErrors = statuses.some(([_, status]) => status.error)

  return {
    synced,
    total,
    percentage: total > 0 ? Math.round((synced / total) * 100) : 0,
    hasErrors,
    lastSync: Math.max(...statuses.map(([_, status]) => status.lastSync?.getTime() || 0)),
  }
}
