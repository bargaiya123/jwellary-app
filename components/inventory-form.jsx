"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function InventoryForm({ initialData = null, onSubmit, isEditing = false }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    karat: initialData?.karat || "",
    weight: initialData?.weight || "",
    pricePerGram: initialData?.pricePerGram || "",
    stockQuantity: initialData?.stockQuantity || "",
    description: initialData?.description || "",
    category: initialData?.category || "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Convert numeric fields
      const submitData = {
        ...formData,
        weight: Number.parseFloat(formData.weight),
        pricePerGram: Number.parseFloat(formData.pricePerGram),
        stockQuantity: Number.parseInt(formData.stockQuantity),
      }

      await onSubmit(submitData)

      // Reset form if not editing
      if (!isEditing) {
        setFormData({
          name: "",
          karat: "",
          weight: "",
          pricePerGram: "",
          stockQuantity: "",
          description: "",
          category: "",
        })
      }
    } catch (error) {
      console.error("Form submission error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Item Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="e.g., Gold Ring, Diamond Necklace"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="karat">Karat</Label>
          <Select value={formData.karat} onValueChange={(value) => handleChange("karat", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select karat" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24K">24K</SelectItem>
              <SelectItem value="22K">22K</SelectItem>
              <SelectItem value="18K">18K</SelectItem>
              <SelectItem value="14K">14K</SelectItem>
              <SelectItem value="10K">10K</SelectItem>
              <SelectItem value="Silver">Silver</SelectItem>
              <SelectItem value="Platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (grams)</Label>
          <Input
            id="weight"
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={(e) => handleChange("weight", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricePerGram">Price per Gram (₹)</Label>
          <Input
            id="pricePerGram"
            type="number"
            step="0.01"
            value={formData.pricePerGram}
            onChange={(e) => handleChange("pricePerGram", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock Quantity</Label>
          <Input
            id="stockQuantity"
            type="number"
            value={formData.stockQuantity}
            onChange={(e) => handleChange("stockQuantity", e.target.value)}
            placeholder="0"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Rings">Rings</SelectItem>
            <SelectItem value="Necklaces">Necklaces</SelectItem>
            <SelectItem value="Earrings">Earrings</SelectItem>
            <SelectItem value="Bracelets">Bracelets</SelectItem>
            <SelectItem value="Chains">Chains</SelectItem>
            <SelectItem value="Pendants">Pendants</SelectItem>
            <SelectItem value="Bangles">Bangles</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Additional details about the item..."
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : isEditing ? "Update Item" : "Add Item"}
      </Button>
    </form>
  )
}
