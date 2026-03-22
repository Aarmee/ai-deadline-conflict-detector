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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertTriangle,
  Plus,
  ArrowLeft,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Bell,
  Calendar,
  Activity,
} from "lucide-react"

// Mock alerts data
const initialAlerts = [
  {
    id: 1,
    type: "Emergency",
    priority: "High",
    elderName: "Eleanor Thompson",
    elderId: 1,
    title: "Fall detected",
    description: "Motion sensor detected a fall in the living room. No response to automated check-in.",
    status: "Active",
    createdAt: "2024-01-16T09:15:00",
    updatedAt: "2024-01-16T09:15:00",
    assignedTo: "Sarah Johnson",
    location: "Living Room",
    contactAttempts: 3,
    resolved: false,
    notes: "Attempting to contact elder and emergency contact.",
  },
  {
    id: 2,
    type: "Medication",
    priority: "Medium",
    elderName: "James Wilson",
    elderId: 2,
    title: "Missed medication reminder",
    description: "Evening medication reminder was not acknowledged. Lisinopril dose overdue by 2 hours.",
    status: "In Progress",
    createdAt: "2024-01-16T08:30:00",
    updatedAt: "2024-01-16T09:00:00",
    assignedTo: "Mike Davis",
    location: "Home",
    contactAttempts: 1,
    resolved: false,
    notes: "Called elder, will take medication now.",
  },
  {
    id: 3,
    type: "Check-in",
    priority: "Low",
    elderName: "Mary Johnson",
    elderId: 3,
    title: "Weekly check-in overdue",
    description: "Scheduled weekly wellness check-in was missed. Last contact was 8 days ago.",
    status: "Pending",
    createdAt: "2024-01-16T07:00:00",
    updatedAt: "2024-01-16T07:00:00",
    assignedTo: "Sarah Johnson",
    location: "Home",
    contactAttempts: 0,
    resolved: false,
    notes: "Need to schedule visit this week.",
  },
  {
    id: 4,
    type: "Health",
    priority: "High",
    elderName: "Robert Martinez",
    elderId: 4,
    title: "Abnormal vital signs",
    description:
      "Blood pressure reading of 180/110 recorded during morning check. Significantly elevated from baseline.",
    status: "Resolved",
    createdAt: "2024-01-15T10:20:00",
    updatedAt: "2024-01-15T14:30:00",
    assignedTo: "Dr. Smith",
    location: "Home",
    contactAttempts: 2,
    resolved: true,
    notes: "Elder taken to clinic. Medication adjusted. Follow-up scheduled.",
  },
  {
    id: 5,
    type: "Safety",
    priority: "Medium",
    elderName: "Dorothy Martinez",
    elderId: 3,
    title: "Door left open overnight",
    description: "Front door sensor indicates door was left unlocked and slightly open from 11 PM to 6 AM.",
    status: "Resolved",
    createdAt: "2024-01-15T06:00:00",
    updatedAt: "2024-01-15T08:15:00",
    assignedTo: "Mike Davis",
    location: "Front Door",
    contactAttempts: 1,
    resolved: true,
    notes: "Visited elder, door secured. Reminder about evening routine provided.",
  },
]

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [selectedAlert, setSelectedAlert] = useState<any>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    type: "Check-in",
    priority: "Medium",
    elderName: "",
    title: "",
    description: "",
    location: "",
    assignedTo: "",
  })

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.elderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !statusFilter || alert.status === statusFilter
    const matchesPriority = !priorityFilter || alert.priority === priorityFilter
    const matchesType = !typeFilter || alert.type === typeFilter

    return matchesSearch && matchesStatus && matchesPriority && matchesType
  })

  const handleAddAlert = () => {
    const newAlert = {
      id: Date.now(),
      type: formData.type,
      priority: formData.priority,
      elderName: formData.elderName,
      elderId: Math.floor(Math.random() * 100),
      title: formData.title,
      description: formData.description,
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTo: formData.assignedTo,
      location: formData.location,
      contactAttempts: 0,
      resolved: false,
      notes: "",
    }
    setAlerts([newAlert, ...alerts])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const updateAlertStatus = (alertId: number, newStatus: string) => {
    setAlerts(
      alerts.map((alert) =>
        alert.id === alertId
          ? {
              ...alert,
              status: newStatus,
              resolved: newStatus === "Resolved",
              updatedAt: new Date().toISOString(),
            }
          : alert,
      ),
    )
  }

  const resetForm = () => {
    setFormData({
      type: "Check-in",
      priority: "Medium",
      elderName: "",
      title: "",
      description: "",
      location: "",
      assignedTo: "",
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "destructive"
      case "In Progress":
        return "secondary"
      case "Pending":
        return "outline"
      case "Resolved":
        return "default"
      default:
        return "outline"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Emergency":
        return <AlertTriangle className="h-4 w-4" />
      case "Health":
        return <Activity className="h-4 w-4" />
      case "Medication":
        return <Clock className="h-4 w-4" />
      case "Check-in":
        return <Calendar className="h-4 w-4" />
      case "Safety":
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const activeAlerts = alerts.filter((alert) => !alert.resolved)
  const highPriorityAlerts = alerts.filter((alert) => alert.priority === "High" && !alert.resolved)

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
              <AlertTriangle className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Alert Management</h1>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Alert
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>Add a new alert for monitoring and follow-up.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-type">Alert Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Medication">Medication</SelectItem>
                      <SelectItem value="Check-in">Check-in</SelectItem>
                      <SelectItem value="Safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="elder-name">Elder Name</Label>
                  <Select
                    value={formData.elderName}
                    onValueChange={(value) => setFormData({ ...formData, elderName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select elder" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Margaret Thompson">Margaret Thompson</SelectItem>
                      <SelectItem value="Robert Wilson">Robert Wilson</SelectItem>
                      <SelectItem value="Dorothy Martinez">Dorothy Martinez</SelectItem>
                      <SelectItem value="Eleanor Thompson">Eleanor Thompson</SelectItem>
                      <SelectItem value="James Wilson">James Wilson</SelectItem>
                      <SelectItem value="Mary Johnson">Mary Johnson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assigned-to">Assigned To</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData({ ...formData, assignedTo: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select caregiver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sarah Johnson">Sarah Johnson</SelectItem>
                      <SelectItem value="Mike Davis">Mike Davis</SelectItem>
                      <SelectItem value="Dr. Smith">Dr. Smith</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title">Alert Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the alert"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Where the alert occurred"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the alert and any relevant information"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAlert}>Create Alert</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold">{activeAlerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                  <p className="text-2xl font-bold">{highPriorityAlerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Resolved Today</p>
                  <p className="text-2xl font-bold">
                    {
                      alerts.filter(
                        (alert) =>
                          alert.resolved && new Date(alert.updatedAt).toDateString() === new Date().toDateString(),
                      ).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response</p>
                  <p className="text-2xl font-bold">12m</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search alerts</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="priority-filter">Priority</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="type-filter">Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Emergency">Emergency</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Medication">Medication</SelectItem>
                <SelectItem value="Check-in">Check-in</SelectItem>
                <SelectItem value="Safety">Safety</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              variant="outline"
              className="w-full bg-transparent"
              onClick={() => {
                setSearchTerm("")
                setStatusFilter("")
                setPriorityFilter("")
                setTypeFilter("")
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Alerts Table */}
        <Card>
          <CardHeader>
            <CardTitle>Alert List</CardTitle>
            <CardDescription>Manage and track all alerts across your care network</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alert</TableHead>
                  <TableHead>Elder</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.map((alert) => (
                  <TableRow key={alert.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {getTypeIcon(alert.type)}
                        <div>
                          <p className="font-medium text-pretty">{alert.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {alert.type} • {alert.location}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {alert.elderName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getPriorityColor(alert.priority)}>{alert.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(alert.status)}>{alert.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{alert.assignedTo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAlert(alert)
                            setIsDetailDialogOpen(true)
                          }}
                        >
                          View
                        </Button>
                        {!alert.resolved && (
                          <Select value={alert.status} onValueChange={(value) => updateAlertStatus(alert.id, value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredAlerts.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No alerts found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter || priorityFilter || typeFilter
                    ? "Try adjusting your search or filter criteria."
                    : "No alerts to display at this time."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alert Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedAlert && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getTypeIcon(selectedAlert.type)}
                  {selectedAlert.title}
                </DialogTitle>
                <DialogDescription>Alert details and response history</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Elder</Label>
                    <p className="text-sm text-muted-foreground">{selectedAlert.elderName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Priority</Label>
                    <div className="mt-1">
                      <Badge variant={getPriorityColor(selectedAlert.priority)}>{selectedAlert.priority}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="mt-1">
                      <Badge variant={getStatusColor(selectedAlert.status)}>{selectedAlert.status}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Assigned To</Label>
                    <p className="text-sm text-muted-foreground">{selectedAlert.assignedTo}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Location</Label>
                    <p className="text-sm text-muted-foreground">{selectedAlert.location}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Contact Attempts</Label>
                    <p className="text-sm text-muted-foreground">{selectedAlert.contactAttempts}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="text-sm text-muted-foreground mt-1 text-pretty">{selectedAlert.description}</p>
                </div>

                {selectedAlert.notes && (
                  <div>
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-sm text-muted-foreground mt-1 text-pretty">{selectedAlert.notes}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p>{new Date(selectedAlert.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p>{new Date(selectedAlert.updatedAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  Close
                </Button>
                {!selectedAlert.resolved && (
                  <Button onClick={() => updateAlertStatus(selectedAlert.id, "Resolved")}>Mark Resolved</Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
