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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Calendar,
  Plus,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Heart,
  Activity,
  Pill,
  Users,
  Clock,
  Edit,
  Trash2,
  Search,
} from "lucide-react"

// Mock journal entries
const initialEntries = [
  {
    id: 1,
    date: "2024-01-16",
    elderName: "Margaret Thompson",
    elderId: 1,
    mood: 8,
    activities: ["Morning walk", "Gardening", "Reading"],
    medications: ["Metformin - 8:00 AM", "Lisinopril - 8:00 AM"],
    vitals: { bloodPressure: "130/80", heartRate: "72", temperature: "98.6" },
    notes:
      "Margaret was in great spirits today. She spent most of the morning in her garden and was excited to show me her new tomato plants. Took all medications on time without reminders.",
    caregiverName: "Sarah Johnson",
    timestamp: "2024-01-16T14:30:00",
    tags: ["positive", "independent"],
  },
  {
    id: 2,
    date: "2024-01-16",
    elderName: "Robert Wilson",
    elderId: 2,
    mood: 6,
    activities: ["TV watching", "Light exercise"],
    medications: ["Aspirin - 9:00 AM", "Atorvastatin - 9:00 AM"],
    vitals: { bloodPressure: "145/90", heartRate: "78", temperature: "98.4" },
    notes:
      "Robert seemed a bit tired today. He mentioned having trouble sleeping last night. Completed his light exercise routine but with less enthusiasm than usual. Blood pressure slightly elevated.",
    caregiverName: "Mike Davis",
    timestamp: "2024-01-16T11:15:00",
    tags: ["tired", "monitoring"],
  },
  {
    id: 3,
    date: "2024-01-15",
    elderName: "Dorothy Martinez",
    elderId: 3,
    mood: 9,
    activities: ["Cooking", "Phone call with family", "Crafts"],
    medications: ["Calcium - 8:00 AM", "Vitamin D - 8:00 AM"],
    vitals: { bloodPressure: "120/75", heartRate: "68", temperature: "98.2" },
    notes:
      "Dorothy was absolutely delightful today! She cooked her famous enchiladas and insisted I take some home. Had a long video call with her grandchildren which made her very happy.",
    caregiverName: "Sarah Johnson",
    timestamp: "2024-01-15T16:45:00",
    tags: ["excellent", "social"],
  },
  {
    id: 4,
    date: "2024-01-15",
    elderName: "Margaret Thompson",
    elderId: 1,
    mood: 7,
    activities: ["Reading", "Light housework"],
    medications: ["Metformin - 8:00 AM", "Lisinopril - 8:00 AM"],
    vitals: { bloodPressure: "125/78", heartRate: "70", temperature: "98.5" },
    notes:
      "Quiet day for Margaret. She spent most of the time reading her mystery novel. Helped with some light housework. All vitals normal.",
    caregiverName: "Mike Davis",
    timestamp: "2024-01-15T13:20:00",
    tags: ["calm", "routine"],
  },
]

export default function JournalPage() {
  const [entries, setEntries] = useState(initialEntries)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("all")
  const [selectedElder, setSelectedElder] = useState("all")
  const [expandedEntries, setExpandedEntries] = useState<number[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    elderName: "",
    elderId: "",
    mood: "7",
    activities: "",
    medications: "",
    bloodPressure: "",
    heartRate: "",
    temperature: "",
    notes: "",
    tags: "",
  })

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      entry.elderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.caregiverName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDate = selectedDate === "all" || !selectedDate || entry.date === selectedDate
    const matchesElder = selectedElder === "all" || !selectedElder || entry.elderName === selectedElder

    return matchesSearch && matchesDate && matchesElder
  })

  const uniqueElders = [...new Set(entries.map((entry) => entry.elderName))]
  const uniqueDates = [...new Set(entries.map((entry) => entry.date))].sort().reverse()

  const toggleExpanded = (entryId: number) => {
    setExpandedEntries((prev) => (prev.includes(entryId) ? prev.filter((id) => id !== entryId) : [...prev, entryId]))
  }

  const handleAddEntry = () => {
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString().split("T")[0],
      elderName: formData.elderName,
      elderId: Number.parseInt(formData.elderId),
      mood: Number.parseInt(formData.mood),
      activities: formData.activities.split(",").map((a) => a.trim()),
      medications: formData.medications.split(",").map((m) => m.trim()),
      vitals: {
        bloodPressure: formData.bloodPressure,
        heartRate: formData.heartRate,
        temperature: formData.temperature,
      },
      notes: formData.notes,
      caregiverName: "Current User",
      timestamp: new Date().toISOString(),
      tags: formData.tags.split(",").map((t) => t.trim()),
    }
    setEntries([newEntry, ...entries])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      elderName: "",
      elderId: "",
      mood: "7",
      activities: "",
      medications: "",
      bloodPressure: "",
      heartRate: "",
      temperature: "",
      notes: "",
      tags: "",
    })
  }

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return "text-green-500"
    if (mood >= 6) return "text-yellow-500"
    return "text-red-500"
  }

  const getMoodEmoji = (mood: number) => {
    if (mood >= 9) return "😊"
    if (mood >= 7) return "🙂"
    if (mood >= 5) return "😐"
    return "😔"
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
              <Calendar className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Daily Journal</h1>
            </div>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Journal Entry</DialogTitle>
                <DialogDescription>Record daily care activities, mood, and observations.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
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
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mood">Mood (1-10)</Label>
                  <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(10)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} {getMoodEmoji(i + 1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="activities">Activities (comma-separated)</Label>
                  <Input
                    id="activities"
                    value={formData.activities}
                    onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                    placeholder="Morning walk, Reading, Gardening"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="medications">Medications Taken (comma-separated)</Label>
                  <Input
                    id="medications"
                    value={formData.medications}
                    onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                    placeholder="Metformin - 8:00 AM, Lisinopril - 8:00 AM"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blood-pressure">Blood Pressure</Label>
                  <Input
                    id="blood-pressure"
                    value={formData.bloodPressure}
                    onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                    placeholder="120/80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heart-rate">Heart Rate</Label>
                  <Input
                    id="heart-rate"
                    value={formData.heartRate}
                    onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                    placeholder="72"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature</Label>
                  <Input
                    id="temperature"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    placeholder="98.6"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="positive, independent, routine"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Care Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Detailed observations about the elder's condition, activities, and any concerns..."
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddEntry}>Add Entry</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search entries</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by elder, notes, or caregiver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date-filter">Filter by date</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="All dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All dates</SelectItem>
                {uniqueDates.map((date) => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="elder-filter">Filter by elder</Label>
            <Select value={selectedElder} onValueChange={setSelectedElder}>
              <SelectTrigger>
                <SelectValue placeholder="All elders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All elders</SelectItem>
                {uniqueElders.map((elder) => (
                  <SelectItem key={elder} value={elder}>
                    {elder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Entries</p>
                  <p className="text-2xl font-bold">{filteredEntries.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Mood</p>
                  <p className="text-2xl font-bold">
                    {filteredEntries.length > 0
                      ? (filteredEntries.reduce((sum, entry) => sum + entry.mood, 0) / filteredEntries.length).toFixed(
                          1,
                        )
                      : "0"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Elders Covered</p>
                  <p className="text-2xl font-bold">{new Set(filteredEntries.map((e) => e.elderName)).size}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">
                    {
                      filteredEntries.filter((entry) => {
                        const entryDate = new Date(entry.date)
                        const weekAgo = new Date()
                        weekAgo.setDate(weekAgo.getDate() - 7)
                        return entryDate >= weekAgo
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Journal Entries */}
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <Collapsible>
                <CollapsibleTrigger className="w-full" onClick={() => toggleExpanded(entry.id)}>
                  <CardHeader className="hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {expandedEntries.includes(entry.id) ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                        <div className="text-left">
                          <CardTitle className="text-lg">{entry.elderName}</CardTitle>
                          <CardDescription className="flex items-center gap-4">
                            <span>{entry.date}</span>
                            <span className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span className={getMoodColor(entry.mood)}>
                                Mood: {entry.mood}/10 {getMoodEmoji(entry.mood)}
                              </span>
                            </span>
                            <span>by {entry.caregiverName}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-6">
                    {/* Quick Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          Activities
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {entry.activities.map((activity, index) => (
                            <li key={index}>• {activity}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Pill className="h-4 w-4 text-primary" />
                          Medications
                        </h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {entry.medications.map((medication, index) => (
                            <li key={index}>• {medication}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          Vitals
                        </h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>BP: {entry.vitals.bloodPressure}</p>
                          <p>HR: {entry.vitals.heartRate} bpm</p>
                          <p>Temp: {entry.vitals.temperature}°F</p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Notes */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Care Notes</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed text-pretty">{entry.notes}</p>
                    </div>

                    {/* Entry Metadata */}
                    <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
                      <span>Recorded on {new Date(entry.timestamp).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" className="h-8 px-2">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>

        {filteredEntries.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No journal entries found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedDate !== "all" || selectedElder !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Start documenting daily care activities and observations."}
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
