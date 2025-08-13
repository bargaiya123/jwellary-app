import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  limit,
  where,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase.js"

// Collections
const COLLECTIONS = {
  INVENTORY: "inventory",
  CUSTOMERS: "customers",
  SALES: "sales",
}

// Inventory Operations
export const inventoryOperations = {
  // Get all inventory items
  async getAll() {
    try {
      const querySnapshot = await getDocs(query(collection(db, COLLECTIONS.INVENTORY), orderBy("createdAt", "desc")))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
    } catch (error) {
      console.error("Error fetching inventory:", error)
      throw error
    }
  },

  // Add new inventory item
  async add(itemData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.INVENTORY), {
        ...itemData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding inventory item:", error)
      throw error
    }
  },

  // Update inventory item
  async update(itemId, updateData) {
    try {
      const docRef = doc(db, COLLECTIONS.INVENTORY, itemId)
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating inventory item:", error)
      throw error
    }
  },

  // Delete inventory item
  async delete(itemId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.INVENTORY, itemId))
    } catch (error) {
      console.error("Error deleting inventory item:", error)
      throw error
    }
  },

  // Get low stock items
  async getLowStock(threshold = 5) {
    try {
      const querySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.INVENTORY),
          where("stockQuantity", "<=", threshold),
          orderBy("stockQuantity", "asc"),
        ),
      )
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
    } catch (error) {
      console.error("Error fetching low stock items:", error)
      throw error
    }
  },

  // Reduce stock quantity (for sales)
  async reduceStock(itemId, quantity) {
    try {
      const docRef = doc(db, COLLECTIONS.INVENTORY, itemId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const currentStock = docSnap.data().stockQuantity
        const newStock = Math.max(0, currentStock - quantity)

        await updateDoc(docRef, {
          stockQuantity: newStock,
          updatedAt: serverTimestamp(),
        })

        return newStock
      }
      throw new Error("Item not found")
    } catch (error) {
      console.error("Error reducing stock:", error)
      throw error
    }
  },
}

// Customer Operations
export const customerOperations = {
  // Get all customers
  async getAll() {
    try {
      const querySnapshot = await getDocs(query(collection(db, COLLECTIONS.CUSTOMERS), orderBy("createdAt", "desc")))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }))
    } catch (error) {
      console.error("Error fetching customers:", error)
      throw error
    }
  },

  // Add new customer
  async add(customerData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTIONS.CUSTOMERS), {
        ...customerData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding customer:", error)
      throw error
    }
  },

  // Update customer
  async update(customerId, updateData) {
    try {
      const docRef = doc(db, COLLECTIONS.CUSTOMERS, customerId)
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating customer:", error)
      throw error
    }
  },

  // Delete customer
  async delete(customerId) {
    try {
      await deleteDoc(doc(db, COLLECTIONS.CUSTOMERS, customerId))
    } catch (error) {
      console.error("Error deleting customer:", error)
      throw error
    }
  },
}

// Sales Operations
export const salesOperations = {
  // Get all sales
  async getAll() {
    try {
      const querySnapshot = await getDocs(query(collection(db, COLLECTIONS.SALES), orderBy("saleDate", "desc")))
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        saleDate: doc.data().saleDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      }))
    } catch (error) {
      console.error("Error fetching sales:", error)
      throw error
    }
  },

  // Add new sale
  async add(saleData) {
    try {
      // Reduce stock for each item in the sale
      for (const item of saleData.items) {
        await inventoryOperations.reduceStock(item.inventoryId, item.quantity)
      }

      const docRef = await addDoc(collection(db, COLLECTIONS.SALES), {
        ...saleData,
        saleDate: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding sale:", error)
      throw error
    }
  },

  // Get recent sales
  async getRecent(limitCount = 10) {
    try {
      const querySnapshot = await getDocs(
        query(collection(db, COLLECTIONS.SALES), orderBy("saleDate", "desc"), limit(limitCount)),
      )
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        saleDate: doc.data().saleDate?.toDate(),
      }))
    } catch (error) {
      console.error("Error fetching recent sales:", error)
      throw error
    }
  },
}

// Dashboard Operations
export const dashboardOperations = {
  // Get dashboard statistics
  async getStats() {
    try {
      const [inventory, customers, sales] = await Promise.all([
        inventoryOperations.getAll(),
        customerOperations.getAll(),
        salesOperations.getRecent(5),
      ])

      const totalInventoryItems = inventory.length
      const totalStockQuantity = inventory.reduce((sum, item) => sum + item.stockQuantity, 0)
      const totalCustomers = customers.length
      const totalSalesAmount = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
      const lowStockItems = inventory.filter((item) => item.stockQuantity <= 5)

      return {
        totalInventoryItems,
        totalStockQuantity,
        totalCustomers,
        totalSalesAmount,
        lowStockItems,
        recentSales: sales,
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error)
      throw error
    }
  },
}

// Export utility functions
export const exportOperations = {
  // Export data to CSV
  exportToCSV(data, filename) {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header]
            return typeof value === "string" ? `"${value}"` : value
          })
          .join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filename}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  },

  // Export data to JSON
  exportToJSON(data, filename) {
    if (!data) return

    const jsonContent = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonContent], { type: "application/json" })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${filename}.json`
    link.click()
    window.URL.revokeObjectURL(url)
  },
}
