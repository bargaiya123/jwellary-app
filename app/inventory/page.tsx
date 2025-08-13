"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, Download } from "lucide-react"
import { inventoryOperations, exportOperations } from "@/lib/database"
import { InventoryForm } from "@/components/inventory-form"
import toast from "react-hot-toast"

export default function InventoryPage() {
  const [inventory, setInventory] = useState([])
  const [filteredInventory, setFilteredInventory] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [selectedItem, setSelectedItem] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true)
        const items = await inventoryOperations.getAll()
        setInventory(items)
        setFilteredInventory(items)
        toast.success(`Loaded ${items.length} inventory items`)
      } catch (error) {
        console.error("Failed to load inventory:", error)
        toast.error("Failed to load inventory data")
      } finally {
        setLoading(false)
      }
    }

    loadInventory()
  }, [])

  useEffect(() => {
    let filtered = inventory.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.karat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter)
    }

    // Apply stock filter
    if (stockFilter === "low") {
      filtered = filtered.filter((item) => item.stockQuantity <= 5)
    } else if (stockFilter === "out") {
      filtered = filtered.filter((item) => item.stockQuantity === 0)
    } else if (stockFilter === "in-stock") {
      filtered = filtered.filter((item) => item.stockQuantity > 5)
    }

    setFilteredInventory(filtered)
  }, [searchTerm, categoryFilter, stockFilter, inventory])

  const handleAddItem = async (itemData) => {
    try {
      const newItemId = await inventoryOperations.add(itemData)
      const newItem = { id: newItemId, ...itemData, createdAt: new Date(), updatedAt: new Date() }
      setInventory((prev) => [newItem, ...prev])
      setIsAddDialogOpen(false)
      toast.success(`Added "${itemData.name}" to inventory`)
    } catch (error) {
      console.error("Failed to add item:", error)
      toast.error("Failed to add inventory item")
    }
  }

  const handleEditItem = async (itemData) => {
    try {
      await inventoryOperations.update(selectedItem.id, itemData)
      const updatedItem = { ...selectedItem, ...itemData, updatedAt: new Date() }
      setInventory((prev) => prev.map((item) => (item.id === selectedItem.id ? updatedItem : item)))
      setIsEditDialogOpen(false)
      setSelectedItem(null)
      toast.success(`Updated "${itemData.name}"`)
    } catch (error) {
      console.error("Failed to update item:", error)
      toast.error("Failed to update inventory item")
    }
  }

  const handleDeleteItem = async (itemId, itemName) => {
    try {
      await inventoryOperations.delete(itemId)
      setInventory((prev) => prev.filter((item) => item.id !== itemId))
      toast.success(`Deleted "${itemName}" from inventory`)
    } catch (error) {
      console.error("Failed to delete item:", error)
      toast.error("Failed to delete inventory item")
    }
  }

  const handleExportCSV = () => {
    try {
      const exportData = filteredInventory.map((item) => ({
        Name: item.name,
        Karat: item.karat,
        Weight: item.weight,
        "Price per Gram": item.pricePerGram,
        "Stock Quantity": item.stockQuantity,
        Category: item.category || "N/A",
        Description: item.description || "N/A",
        "Created Date": item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "N/A",
      }))
      exportOperations.exportToCSV(exportData, "inventory-export")
      toast.success("Inventory exported to CSV")
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Failed to export inventory")
    }
  }

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: "Out of Stock", variant: "destructive" }
    if (quantity <= 5) return { label: "Low Stock", variant: "secondary" }
    return { label: "In Stock", variant: "default" }
  }

  const getUniqueCategories = () => {
    const categories = inventory.map((item) => item.category).filter(Boolean)
    return [...new Set(categories)]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-64"></div>
            <div className="h-96 bg-slate-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">Inventory Management</h1>
            <p className="text-slate-600">Manage your jewelry inventory and stock levels</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Inventory Item</DialogTitle>
                  <DialogDescription>Enter the details for the new jewelry item.</DialogDescription>
                </DialogHeader>
                <InventoryForm onSubmit={handleAddItem} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Items</p>
                  <p className="text-3xl font-bold text-slate-900">{inventory.length}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Stock</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {inventory.reduce((sum, item) => sum + item.stockQuantity, 0)}
                  </p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Low Stock Items</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {inventory.filter((item) => item.stockQuantity <= 5).length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Value</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹
                    {inventory
                      .reduce((sum, item) => sum + item.pricePerGram * item.weight * item.stockQuantity, 0)
                      .toLocaleString()}
                  </p>
                </div>
                <Package className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle>Inventory Items</CardTitle>
                <CardDescription>
                  {filteredInventory.length} of {inventory.length} items
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search by name, karat, or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full sm:w-80"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getUniqueCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Stock Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock</SelectItem>
                    <SelectItem value="in-stock">In Stock</SelectItem>
                    <SelectItem value="low">Low Stock</SelectItem>
                    <SelectItem value="out">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Karat</TableHead>
                    <TableHead>Weight (g)</TableHead>
                    <TableHead>Price/g</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                        {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                          ? "No items match your filters"
                          : "No inventory items found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredInventory.map((item) => {
                      const stockStatus = getStockStatus(item.stockQuantity)
                      const totalValue = item.pricePerGram * item.weight * item.stockQuantity
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category || "N/A"}</TableCell>
                          <TableCell>{item.karat}</TableCell>
                          <TableCell>{item.weight}</TableCell>
                          <TableCell>₹{item.pricePerGram.toLocaleString()}</TableCell>
                          <TableCell>{item.stockQuantity}</TableCell>
                          <TableCell>
                            <Badge variant={stockStatus.variant}>{stockStatus.label}</Badge>
                          </TableCell>
                          <TableCell>₹{totalValue.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedItem(item)
                                  setIsEditDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteItem(item.id, item.name)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Inventory Item</DialogTitle>
              <DialogDescription>Update the details for this jewelry item.</DialogDescription>
            </DialogHeader>
            {selectedItem && <InventoryForm initialData={selectedItem} onSubmit={handleEditItem} isEditing={true} />}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
