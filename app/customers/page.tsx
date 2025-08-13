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
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, Eye, Download } from "lucide-react"
import { customerOperations, salesOperations, exportOperations } from "@/lib/database"
import { CustomerForm } from "@/components/customer-form"
import toast from "react-hot-toast"

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [filteredCustomers, setFilteredCustomers] = useState([])
  const [customerSales, setCustomerSales] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [customersData, salesData] = await Promise.all([customerOperations.getAll(), salesOperations.getAll()])

        setCustomers(customersData)
        setFilteredCustomers(customersData)

        // Group sales by customer
        const salesByCustomer = {}
        salesData.forEach((sale) => {
          if (!salesByCustomer[sale.customerName]) {
            salesByCustomer[sale.customerName] = []
          }
          salesByCustomer[sale.customerName].push(sale)
        })
        setCustomerSales(salesByCustomer)

        toast.success(`Loaded ${customersData.length} customers`)
      } catch (error) {
        console.error("Failed to load customers:", error)
        toast.error("Failed to load customer data")
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredCustomers(filtered)
  }, [searchTerm, customers])

  const handleAddCustomer = async (customerData) => {
    try {
      const newCustomerId = await customerOperations.add(customerData)
      const newCustomer = { id: newCustomerId, ...customerData, createdAt: new Date(), updatedAt: new Date() }
      setCustomers((prev) => [newCustomer, ...prev])
      setIsAddDialogOpen(false)
      toast.success(`Added customer "${customerData.name}"`)
    } catch (error) {
      console.error("Failed to add customer:", error)
      toast.error("Failed to add customer")
    }
  }

  const handleEditCustomer = async (customerData) => {
    try {
      await customerOperations.update(selectedCustomer.id, customerData)
      const updatedCustomer = { ...selectedCustomer, ...customerData, updatedAt: new Date() }
      setCustomers((prev) => prev.map((customer) => (customer.id === selectedCustomer.id ? updatedCustomer : customer)))
      setIsEditDialogOpen(false)
      setSelectedCustomer(null)
      toast.success(`Updated customer "${customerData.name}"`)
    } catch (error) {
      console.error("Failed to update customer:", error)
      toast.error("Failed to update customer")
    }
  }

  const handleDeleteCustomer = async (customerId, customerName) => {
    try {
      await customerOperations.delete(customerId)
      setCustomers((prev) => prev.filter((customer) => customer.id !== customerId))
      toast.success(`Deleted customer "${customerName}"`)
    } catch (error) {
      console.error("Failed to delete customer:", error)
      toast.error("Failed to delete customer")
    }
  }

  const handleExportCSV = () => {
    try {
      const exportData = filteredCustomers.map((customer) => {
        const sales = customerSales[customer.name] || []
        const totalPurchases = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
        const purchaseCount = sales.length

        return {
          Name: customer.name,
          Phone: customer.phone || "N/A",
          Email: customer.email || "N/A",
          Address: customer.address || "N/A",
          "Total Purchases": purchaseCount,
          "Total Spent": totalPurchases,
          "Last Purchase":
            sales.length > 0
              ? new Date(Math.max(...sales.map((s) => new Date(s.saleDate)))).toLocaleDateString()
              : "Never",
          "Created Date": customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : "N/A",
        }
      })
      exportOperations.exportToCSV(exportData, "customers-export")
      toast.success("Customer data exported to CSV")
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Failed to export customer data")
    }
  }

  const getCustomerStats = (customerName) => {
    const sales = customerSales[customerName] || []
    const totalSpent = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const purchaseCount = sales.length
    const lastPurchase = sales.length > 0 ? new Date(Math.max(...sales.map((s) => new Date(s.saleDate)))) : null

    return { totalSpent, purchaseCount, lastPurchase }
  }

  const getTotalCustomerValue = () => {
    return filteredCustomers.reduce((sum, customer) => {
      const stats = getCustomerStats(customer.name)
      return sum + stats.totalSpent
    }, 0)
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
            <h1 className="text-4xl font-bold text-slate-900">Customer Management</h1>
            <p className="text-slate-600">Manage your customer relationships and purchase history</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV} className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>Enter the customer's information.</DialogDescription>
                </DialogHeader>
                <CustomerForm onSubmit={handleAddCustomer} />
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
                  <p className="text-sm font-medium text-slate-600">Total Customers</p>
                  <p className="text-3xl font-bold text-slate-900">{customers.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active Customers</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {customers.filter((customer) => getCustomerStats(customer.name).purchaseCount > 0).length}
                  </p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Customer Value</p>
                  <p className="text-3xl font-bold text-slate-900">₹{getTotalCustomerValue().toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Customer Value</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹
                    {customers.length > 0 ? Math.round(getTotalCustomerValue() / customers.length).toLocaleString() : 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer List */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle>Customer Directory</CardTitle>
                <CardDescription>
                  {filteredCustomers.length} of {customers.length} customers
                </CardDescription>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, phone, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Last Purchase</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        {searchTerm ? "No customers match your search" : "No customers found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const stats = getCustomerStats(customer.name)
                      return (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {customer.phone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {customer.phone}
                                </div>
                              )}
                              {customer.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {customer.email}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{stats.purchaseCount}</TableCell>
                          <TableCell className="font-semibold text-green-600">
                            ₹{stats.totalSpent.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {stats.lastPurchase ? stats.lastPurchase.toLocaleDateString() : "Never"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={stats.purchaseCount > 0 ? "default" : "secondary"}>
                              {stats.purchaseCount > 0 ? "Active" : "New"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
                                  setIsViewDialogOpen(true)
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedCustomer(customer)
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
                                    <AlertDialogTitle>Delete Customer</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{customer.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCustomer(customer.id, customer.name)}
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
              <DialogTitle>Edit Customer</DialogTitle>
              <DialogDescription>Update the customer's information.</DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <CustomerForm initialData={selectedCustomer} onSubmit={handleEditCustomer} isEditing={true} />
            )}
          </DialogContent>
        </Dialog>

        {/* View Customer Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>Complete customer information and purchase history.</DialogDescription>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p>
                        <strong>Name:</strong> {selectedCustomer.name}
                      </p>
                      {selectedCustomer.phone && (
                        <p>
                          <strong>Phone:</strong> {selectedCustomer.phone}
                        </p>
                      )}
                      {selectedCustomer.email && (
                        <p>
                          <strong>Email:</strong> {selectedCustomer.email}
                        </p>
                      )}
                      {selectedCustomer.address && (
                        <p>
                          <strong>Address:</strong> {selectedCustomer.address}
                        </p>
                      )}
                      <p>
                        <strong>Customer Since:</strong> {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Purchase Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {(() => {
                        const stats = getCustomerStats(selectedCustomer.name)
                        return (
                          <>
                            <p>
                              <strong>Total Purchases:</strong> {stats.purchaseCount}
                            </p>
                            <p>
                              <strong>Total Spent:</strong> ₹{stats.totalSpent.toLocaleString()}
                            </p>
                            <p>
                              <strong>Average Order:</strong> ₹
                              {stats.purchaseCount > 0
                                ? Math.round(stats.totalSpent / stats.purchaseCount).toLocaleString()
                                : 0}
                            </p>
                            <p>
                              <strong>Last Purchase:</strong>{" "}
                              {stats.lastPurchase ? stats.lastPurchase.toLocaleDateString() : "Never"}
                            </p>
                          </>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </div>

                {/* Purchase History */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Purchase History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {customerSales[selectedCustomer.name]?.length > 0 ? (
                      <div className="space-y-3">
                        {customerSales[selectedCustomer.name]
                          .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))
                          .map((sale) => (
                            <div key={sale.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                              <div>
                                <p className="font-medium">{new Date(sale.saleDate).toLocaleDateString()}</p>
                                <p className="text-sm text-slate-600">
                                  {sale.items.length} item{sale.items.length > 1 ? "s" : ""} •{" "}
                                  {sale.paymentMethod || "Cash"}
                                </p>
                              </div>
                              <p className="font-semibold text-green-600">₹{sale.totalAmount.toLocaleString()}</p>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-center py-8 text-slate-500">No purchase history</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
