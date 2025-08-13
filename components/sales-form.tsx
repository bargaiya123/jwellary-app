"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Minus, Trash2 } from "lucide-react"
import { inventoryOperations } from "@/lib/database"
import toast from "react-hot-toast"

export function SalesForm({ onSubmit, customers = [] }) {
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    paymentMethod: "cash",
    notes: "",
    items: [],
  })

  const [inventory, setInventory] = useState([])
  const [selectedItem, setSelectedItem] = useState("")
  const [quantity, setQuantity] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const loadInventory = async () => {
      try {
        const items = await inventoryOperations.getAll()
        setInventory(items.filter((item) => item.stockQuantity > 0))
      } catch (error) {
        console.error("Failed to load inventory:", error)
        toast.error("Failed to load inventory")
      }
    }
    loadInventory()
  }, [])

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const addItemToSale = () => {
    if (!selectedItem) {
      toast.error("Please select an item")
      return
    }

    const inventoryItem = inventory.find((item) => item.id === selectedItem)
    if (!inventoryItem) {
      toast.error("Item not found")
      return
    }

    if (quantity > inventoryItem.stockQuantity) {
      toast.error(`Only ${inventoryItem.stockQuantity} items available in stock`)
      return
    }

    const existingItemIndex = formData.items.findIndex((item) => item.inventoryId === selectedItem)

    if (existingItemIndex >= 0) {
      const existingItem = formData.items[existingItemIndex]
      const newQuantity = existingItem.quantity + quantity

      if (newQuantity > inventoryItem.stockQuantity) {
        toast.error(`Only ${inventoryItem.stockQuantity} items available in stock`)
        return
      }

      const updatedItems = [...formData.items]
      updatedItems[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
        totalPrice: inventoryItem.pricePerGram * inventoryItem.weight * newQuantity,
      }

      setFormData((prev) => ({ ...prev, items: updatedItems }))
    } else {
      const newItem = {
        inventoryId: selectedItem,
        name: inventoryItem.name,
        karat: inventoryItem.karat,
        weight: inventoryItem.weight,
        pricePerGram: inventoryItem.pricePerGram,
        quantity: quantity,
        totalPrice: inventoryItem.pricePerGram * inventoryItem.weight * quantity,
      }

      setFormData((prev) => ({
        ...prev,
        items: [...prev.items, newItem],
      }))
    }

    setSelectedItem("")
    setQuantity(1)
    toast.success("Item added to sale")
  }

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromSale(index)
      return
    }

    const item = formData.items[index]
    const inventoryItem = inventory.find((inv) => inv.id === item.inventoryId)

    if (newQuantity > inventoryItem.stockQuantity) {
      toast.error(`Only ${inventoryItem.stockQuantity} items available in stock`)
      return
    }

    const updatedItems = [...formData.items]
    updatedItems[index] = {
      ...item,
      quantity: newQuantity,
      totalPrice: item.pricePerGram * item.weight * newQuantity,
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }))
  }

  const removeItemFromSale = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, items: updatedItems }))
    toast.success("Item removed from sale")
  }

  const getTotalAmount = () => {
    return formData.items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.customerName.trim()) {
      toast.error("Customer name is required")
      return
    }

    if (formData.items.length === 0) {
      toast.error("Please add at least one item to the sale")
      return
    }

    setIsSubmitting(true)

    try {
      const saleData = {
        ...formData,
        totalAmount: getTotalAmount(),
      }

      await onSubmit(saleData)

      // Reset form
      setFormData({
        customerName: "",
        customerPhone: "",
        paymentMethod: "cash",
        notes: "",
        items: [],
      })
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name *</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone Number</Label>
              <Input
                id="customerPhone"
                value={formData.customerPhone}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Items to Sale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="item">Select Item</Label>
              <Select value={selectedItem} onValueChange={setSelectedItem}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} - {item.karat} ({item.stockQuantity} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
              />
            </div>
            <Button type="button" onClick={addItemToSale} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Items in Sale */}
          {formData.items.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Items in Sale</h4>
              {formData.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-slate-600">
                      {item.karat} • {item.weight}g • ₹{item.pricePerGram}/g
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateItemQuantity(index, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => updateItemQuantity(index, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Badge variant="secondary" className="ml-2">
                      ₹{item.totalPrice.toLocaleString()}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItemFromSale(index)}
                      className="ml-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment & Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment & Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => handleChange("paymentMethod", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="cheque">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Any additional notes about this sale..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Total & Submit */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xl font-semibold">Total Amount:</span>
            <span className="text-2xl font-bold text-green-600">₹{getTotalAmount().toLocaleString()}</span>
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting ? "Recording Sale..." : "Record Sale"}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
