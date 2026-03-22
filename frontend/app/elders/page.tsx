"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Pill,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react"

// Mock elder data
const initialElders = [
  {
    id: 1,
    name: "Margaret Thompson",
    age: 78,
    address: "123 Oak Street, Millfield",
    phone: "(555) 123-4567",
    emergencyContact: "Sarah Thompson (Daughter)",
    emergencyPhone: "(555) 987-6543",
    conditions: ["Diabetes", "Hypertension"],
    medications: ["Metformin", "Lisinopril"],
    riskLevel: "Medium",
    lastCheckIn: "2024-01-15",
    mood: 8,
    notes: "Enjoys gardening and reading. Prefers morning visits.",
  },
  {
    id: 2,
    name: "Robert Wilson",
    age: 82,
    address: "456 Pine Avenue, Millfield",
    phone: "(555) 234-5678",
    emergencyContact: "Michael Wilson (Son)",
    emergencyPhone: "(555) 876-5432",
    conditions: ["Arthritis", "Heart Disease"],
    medications: ["Aspirin", "Atorvastatin"],
    riskLevel: "High",
    lastCheckIn: "2024-01-14",
    mood: 6,
    notes: "Former veteran. Enjoys talking about history.",
  },
  {
    id: 3,
    name: "Dorothy Martinez",
    age: 75,
    address: "789 Elm Drive, Millfield",
    phone: "(555) 345-6789",
    emergencyContact: "Carlos Martinez (Nephew)",
    emergencyPhone: "(555) 765-4321",
    conditions: ["Osteoporosis"],
    medications: ["Calcium", "Vitamin D"],
    riskLevel: "Low",
    lastCheckIn: "2024-01-16",
    mood: 9,
    notes: "Very social, loves cooking traditional recipes.",
  },
]

export default function EldersPage() {
  const [elders, setElders] = useState(initialElders)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedElder, setSelectedElder] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    address: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: "",
    conditions: "",
    medications: "",
    riskLevel: "Low",
    notes: "",
  })

  const filteredElders = elders.filter(
    (elder) =>
      elder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      elder.address.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddElder = () => {
    const newElder = {
      id: Date.now(),
      name: formData.name,
      age: Number.parseInt(formData.age),
      address: formData.address,
      phone: formData.phone,
      emergencyContact: formData.emergencyContact,
      emergencyPhone: formData.emergencyPhone,
      conditions: formData.conditions.split(",").map((c) => c.trim()),
      medications: formData.medications.split(",").map((m) => m.trim()),
      riskLevel: formData.riskLevel,
      lastCheckIn: new Date().toISOString().split("T")[0],
      mood: 7,
      notes: formData.notes,
    }
    setElders([...elders, newElder])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditElder = () => {
    const updatedElders = elders.map((elder) =>
      elder.id === selectedElder.id
        ? {
            ...elder,
            name: formData.name,
            age: Number.parseInt(formData.age),
            address: formData.address,
            phone: formData.phone,
            emergencyContact: formData.emergencyContact,
            emergencyPhone: formData.emergencyPhone,
            conditions: formData.conditions.split(",").map((c) => c.trim()),
            medications: formData.medications.split(",").map((m) => m.trim()),
            riskLevel: formData.riskLevel,
            notes: formData.notes,
          }
        : elder,
    )
    setElders(updatedElders)
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteElder = (id: number) => {
    setElders(elders.filter((elder) => elder.id !== id))
  }

  const resetForm = () => {
    setFormData({
      name: "",
      age: "",
      address: "",
      phone: "",
      emergencyContact: "",
      emergencyPhone: "",
      conditions: "",
      medications: "",
      riskLevel: "Low",
      notes: "",
    })
  }

  const openEditDialog = (elder: any) => {
    setSelectedElder(elder)
    setFormData({
      name: elder.name,
      age: elder.age.toString(),
      address: elder.address,
      phone: elder.phone,
      emergencyContact: elder.emergencyContact,
      emergencyPhone: elder.emergencyPhone,
      conditions: elder.conditions.join(", "),
      medications: elder.medications.join(", "),
      riskLevel: elder.riskLevel,
      notes: elder.notes,
    })
    setIsEditDialogOpen(true)
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "High":
        return "destructive"
      case "Medium":
        return "secondary"
      case "Low":
        return "outline"
      default:
        return "outline"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => (window.location.href = "/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Elder Management</h1>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Elder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Elder</DialogTitle>
                <DialogDescription>Enter the elder's information to add them to your care list.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Margaret Thompson"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="78"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Oak Street, Millfield"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="risk">Risk Level</Label>
                  <Select
                    value={formData.riskLevel}
                    onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency-contact">Emergency Contact</Label>
                  <Input
                    id="emergency-contact"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="Sarah Thompson (Daughter)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency-phone">Emergency Phone</Label>
                  <Input
                    id="emergency-phone"
                    value={formData.emergencyPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                    placeholder="(555) 987-6543"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="conditions">Medical Conditions (comma-separated)</Label>
                  <Input
                    id="conditions"
                    value={formData.conditions}
                    onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                    placeholder="Diabetes, Hypertension"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medications">Medications (comma-separated)</Label>
                  <Input
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    placeholder="Metformin, Lisinopril"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Care Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Special care instructions, preferences, etc."
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddElder}>Add Elder</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Search and Stats */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search elders by name or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>Total: {elders.length}</span>
            <span>High Risk: {elders.filter((e) => e.riskLevel === "High").length}</span>
            <span>Medium Risk: {elders.filter((e) => e.riskLevel === "Medium").length}</span>
            <span>Low Risk: {elders.filter((e) => e.riskLevel === "Low").length}</span>
          </div>
        </div>

        {/* Elder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredElders.map((elder) => (
            <Card key={elder.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{elder.name}</CardTitle>
                    <CardDescription>Age {elder.age}</CardDescription>
                  </div>
                  <Badge variant={getRiskColor(elder.riskLevel)}>{elder.riskLevel} Risk</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="text-pretty">{elder.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{elder.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Last check-in: {elder.lastCheckIn}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Mood: {elder.mood}/10</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill className="h-4 w-4 text-primary" />
                    <span className="text-sm">{elder.medications.length} medications</span>
                  </div>
                  {elder.conditions.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      <span className="text-sm">{elder.conditions.length} conditions</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-transparent"
                    onClick={() => openEditDialog(elder)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteElder(elder.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredElders.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No elders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "Try adjusting your search terms." : "Get started by adding your first elder."}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Elder
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Elder Information</DialogTitle>
            <DialogDescription>Update the elder's information and care details.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-age">Age</Label>
              <Input
                id="edit-age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-risk">Risk Level</Label>
              <Select
                value={formData.riskLevel}
                onValueChange={(value) => setFormData({ ...formData, riskLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-emergency-contact">Emergency Contact</Label>
              <Input
                id="edit-emergency-contact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-emergency-phone">Emergency Phone</Label>
              <Input
                id="edit-emergency-phone"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-conditions">Medical Conditions (comma-separated)</Label>
              <Input
                id="edit-conditions"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-medications">Medications (comma-separated)</Label>
              <Input
                id="edit-medications"
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-notes">Care Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditElder}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
