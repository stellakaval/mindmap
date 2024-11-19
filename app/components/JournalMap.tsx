"use client";

import React, { useState, useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapPin,
  Trash2,
  Search,
  Filter,
  Calendar,
  BookOpen,
  MessageSquare,
} from "lucide-react";

mapboxgl.accessToken = "pk.eyJ1Ijoic2thdmFsIiwiYSI6ImNtM25ncDE1MTBiZmUybG16MWZ6Y2RmcXEifQ.j1qvxxSCuvP83O01zizWAQ";

interface JournalTemplate {
  id: string;
  name: string;
  fields: {
    name: string;
    type: "text" | "textarea" | "number" | "date" | "mood";
  }[];
}

interface JournalEntry {
  id: number;
  title: string;
  mood: string;
  location: [number, number];
  date: string;
  description: string;
  template?: string;
  fields?: { [key: string]: string };
}

const moodToColor = {
  Happiness: "#FFFF00",
  Calmness: "#0000FF",
  Energy: "#FF0000",
  Sadness: "#808080",
  Envy: "#00FF00",
  Creativity: "#800080",
  Warmth: "#FFA500",
  Serenity: "#40E0D0",
  Passion: "#8B0000",
  Nostalgia: "#8B4513",
  Anger: "#000000",
  Confidence: "#FFD700",
  Peacefulness: "#98FB98",
  Mystery: "#4B0082",
};

const journalTemplates: JournalTemplate[] = [
  {
    id: "gratitude",
    name: "Gratitude Journal",
    fields: [
      { name: "What are you grateful for today?", type: "textarea" },
      { name: "How did this make you feel?", type: "text" },
      { name: "Gratitude level", type: "number" },
    ],
  },
  {
    id: "goal-tracking",
    name: "Goal Tracking",
    fields: [
      { name: "Goal", type: "text" },
      { name: "Progress", type: "textarea" },
      { name: "Obstacles", type: "textarea" },
      { name: "Next steps", type: "text" },
    ],
  },
];

const journalingPrompts = [
  "What are three things you're grateful for today?",
  "Describe a challenge you overcame recently.",
  "What's a goal you're working towards? How are you progressing?",
  "Write about a person who has positively influenced your life.",
  "Describe your ideal day. What would you do?",
];

export default function JournalMap() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({});
  const [selectedLocation, setSelectedLocation] = useState<
    [number, number] | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMood, setFilterMood] = useState("");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<JournalTemplate | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: number]: mapboxgl.Marker }>({});
  const tempMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-122.2585, 37.8719],
      zoom: 14,
    });
    map.current.on("load", () => {
      map.current!.on("click", (e) => {
        setSelectedLocation([e.lngLat.lng, e.lngLat.lat]);
        setNewEntry({});
        setIsEditing(false);
        setSelectedTemplate(null);
        if (tempMarker.current) {
          tempMarker.current.remove();
        }
        const el = document.createElement("div");
        el.className = "marker";
        el.style.backgroundColor = "#808080";
        el.style.width = "20px";
        el.style.height = "20px";
        el.style.borderRadius = "50%";
        el.style.opacity = "0.7";
        tempMarker.current = new mapboxgl.Marker(el)
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map.current!);
      });
    });
    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!map.current) return;
    Object.values(markers.current).forEach((marker) => marker.remove());
    markers.current = {};
    const filteredEntries = entries.filter(
      (entry) =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterMood === "" || entry.mood === filterMood) &&
        (dateRange.start === "" ||
          new Date(entry.date) >= new Date(dateRange.start)) &&
        (dateRange.end === "" ||
          new Date(entry.date) <= new Date(dateRange.end))
    );
    filteredEntries.forEach((entry) => {
      const el = document.createElement("div");
      el.className = "marker";
      el.style.backgroundColor =
        moodToColor[entry.mood as keyof typeof moodToColor] || "#000000";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      const marker = new mapboxgl.Marker(el)
        .setLngLat(entry.location)
        .addTo(map.current!);
      marker
        .getElement()
        .addEventListener("click", () => handleEntryClick(entry));
      markers.current[entry.id] = marker;
    });
  }, [entries, searchTerm, filterMood, dateRange]);

  const getRandomPrompt = () => {
    const randomIndex = Math.floor(Math.random() * journalingPrompts.length);
    setCurrentPrompt(journalingPrompts[randomIndex]);
    setShowPrompt(true);
  };

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntry.title && selectedLocation && newEntry.mood) {
      const entry: JournalEntry = {
        id: isEditing ? (newEntry.id as number) : Date.now(),
        title: newEntry.title,
        date: newEntry.date || new Date().toISOString(),
        location: selectedLocation,
        mood: newEntry.mood,
        description: newEntry.description || "",
        template: selectedTemplate?.id,
        fields: newEntry.fields,
      };
      setEntries((prevEntries) =>
        isEditing
          ? prevEntries.map((e) => (e.id === entry.id ? entry : e))
          : [...prevEntries, entry]
      );
      setNewEntry({});
      setSelectedLocation(null);
      setIsEditing(false);
      setSelectedTemplate(null);
      if (tempMarker.current) {
        tempMarker.current.remove();
        tempMarker.current = null;
      }
    }
  };

  const handleEntryClick = (entry: JournalEntry) => {
    setNewEntry(entry);
    setSelectedLocation(entry.location);
    setIsEditing(true);
    setSelectedTemplate(
      journalTemplates.find((t) => t.id === entry.template) || null
    );
    map.current?.flyTo({
      center: entry.location,
      zoom: 17,
    });
  };

  const handleDeleteEntry = (id: number) => {
    setEntries((prevEntries) => prevEntries.filter((entry) => entry.id !== id));
    if (markers.current[id]) {
      markers.current[id].remove();
      delete markers.current[id];
    }
  };

  const handleCancelEdit = () => {
    setNewEntry({});
    setSelectedLocation(null);
    setIsEditing(false);
    setSelectedTemplate(null);
    if (tempMarker.current) {
      tempMarker.current.remove();
      tempMarker.current = null;
    }
  };

  return (
    <div className="flex h-screen w-screen">
      <div className="w-96 h-full overflow-y-auto bg-white shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">UC Berkeley MindMap</h1>
        <p className="text-sm text-gray-600 mb-4">
          Click on the map to create a new entry.
        </p>

        <div className="mb-4">
          <div className="flex items-center mb-2">
            <Search className="w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div className="flex items-center mb-2">
            <Filter className="w-4 h-4 mr-2" />
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Moods</option>
              {Object.keys(moodToColor).map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, start: e.target.value }))
              }
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md mr-2"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-1/2 px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-between mb-4">
          <button
            onClick={() => {
              getRandomPrompt();
              setShowTemplates(false);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Get Prompt
          </button>
          <button
            onClick={() => {
              setShowTemplates(true);
              setShowPrompt(false);
            }}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Use Template
          </button>
        </div>

        {showPrompt && (
          <div className="mb-4 p-4 bg-yellow-100 rounded-md">
            <h3 className="font-bold mb-2">Journaling Prompt:</h3>
            <p className="italic mb-2">{currentPrompt}</p>
            <button
              onClick={() => setShowPrompt(false)}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Close
            </button>
          </div>
        )}

        {selectedLocation && (
          <form onSubmit={handleAddEntry} className="mb-4">
            <h2 className="text-lg font-semibold mb-2">
              {isEditing ? "Edit Entry" : "Add New Entry"}
            </h2>

            {showTemplates && (
              <div className="mb-4">
                <label
                  htmlFor="template"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Journal Template
                </label>
                <select
                  id="template"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={selectedTemplate?.id || ""}
                  onChange={(e) => {
                    const template = journalTemplates.find(
                      (t) => t.id === e.target.value
                    );
                    setSelectedTemplate(template || null);
                    if (template) {
                      setNewEntry({
                        ...newEntry,
                        template: template.id,
                        fields: template.fields.reduce(
                          (acc, field) => ({
                            ...acc,
                            [field.name]: "",
                          }),
                          {}
                        ),
                      });
                    }
                  }}
                >
                  <option value="">Select a template</option>
                  {journalTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                id="title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newEntry.title || ""}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, title: e.target.value })
                }
                placeholder="Entry title"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="mood"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mood
              </label>
              <select
                id="mood"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newEntry.mood || ""}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, mood: e.target.value })
                }
              >
                <option value="">Select a mood</option>
                {Object.entries(moodToColor).map(([mood, color]) => (
                  <option
                    key={mood}
                    value={mood}
                    style={{
                      backgroundColor: color,
                      color: mood === "Happiness" ? "black" : "white",
                    }}
                  >
                    {mood}
                  </option>
                ))}
              </select>
            </div>
            {selectedTemplate && (
              <div className="mb-4">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.name} className="mb-2">
                    <label
                      htmlFor={field.name}
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {field.name}
                    </label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newEntry.fields?.[field.name] || ""}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            fields: {
                              ...newEntry.fields,
                              [field.name]: e.target.value,
                            },
                          })
                        }
                        rows={3}
                      />
                    ) : (
                      <input
                        id={field.name}
                        type={field.type}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={newEntry.fields?.[field.name] || ""}
                        onChange={(e) =>
                          setNewEntry({
                            ...newEntry,
                            fields: {
                              ...newEntry.fields,
                              [field.name]: e.target.value,
                            },
                          })
                        }
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
            {!selectedTemplate && (
              <div className="mb-4">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  value={newEntry.description || ""}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, description: e.target.value })
                  }
                  placeholder="Entry description"
                  rows={3}
                />
              </div>
            )}
            <div className="mb-4">
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date
              </label>
              <input
                id="date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={
                  newEntry.date
                    ? new Date(newEntry.date).toISOString().split("T")[0]
                    : ""
                }
                onChange={(e) =>
                  setNewEntry({
                    ...newEntry,
                    date: new Date(e.target.value).toISOString(),
                  })
                }
              />
            </div>
            <div className="flex justify-between">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isEditing ? "Update Entry" : "Save Entry"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-4">
          <h3 className="font-bold mb-2">Recent Entries</h3>
          {entries
            .filter(
              (entry) =>
                entry.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                (filterMood === "" || entry.mood === filterMood) &&
                (dateRange.start === "" ||
                  new Date(entry.date) >= new Date(dateRange.start)) &&
                (dateRange.end === "" ||
                  new Date(entry.date) <= new Date(dateRange.end))
            )
            .map((entry) => (
              <div
                key={entry.id}
                className="p-2 border-b border-gray-200 hover:bg-gray-100"
              >
                <div
                  onClick={() => handleEntryClick(entry)}
                  className="cursor-pointer"
                >
                  <h4 className="font-semibold">{entry.title}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(entry.date).toLocaleString()}
                  </p>
                  <div className="flex items-center mt-1">
                    <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                    <span
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        backgroundColor:
                          moodToColor[entry.mood as keyof typeof moodToColor],
                        color: entry.mood === "Happiness" ? "black" : "white",
                      }}
                    >
                      {entry.mood}
                    </span>
                  </div>
                  {entry.description && (
                    <p className="text-sm mt-1">{entry.description}</p>
                  )}
                  {entry.fields &&
                    Object.entries(entry.fields).map(([key, value]) => (
                      <p key={key} className="text-sm mt-1">
                        <strong>{key}:</strong> {value}
                      </p>
                    ))}
                </div>
                <button
                  onClick={() => handleDeleteEntry(entry.id)}
                  className="mt-2 flex items-center text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </button>
              </div>
            ))}
        </div>
      </div>
      <div ref={mapContainer} className="flex-grow h-full" />
    </div>
  );
}
