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
  MessageSquare,
} from "lucide-react";

mapboxgl.accessToken =
  "pk.eyJ1Ijoic2thdmFsIiwiYSI6ImNtM25ncDE1MTBiZmUybG16MWZ6Y2RmcXEifQ.j1qvxxSCuvP83O01zizWAQ";

interface JournalEntry {
  id: number;
  title: string;
  mood: string;
  location: [number, number];
  date: string;
  description: string;
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
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);
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
      };
      setEntries((prevEntries) =>
        isEditing
          ? prevEntries.map((e) => (e.id === entry.id ? entry : e))
          : [...prevEntries, entry]
      );
      setNewEntry({});
      setSelectedLocation(null);
      setIsEditing(false);
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
    if (tempMarker.current) {
      tempMarker.current.remove();
      tempMarker.current = null;
    }
  };

  return (
    <div className="flex h-screen w-screen">
      <div className="w-96 h-full overflow-y-auto bg-white shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-black">
          UC Berkeley MindMap
        </h1>
        <p className="text-sm text-black mb-4">
          Click on the map to create a new entry.
        </p>

        {selectedLocation && (
          <form
            onSubmit={handleAddEntry}
            className="mb-4 bg-gray-100 p-4 rounded-lg"
          >
            <h2 className="text-lg font-semibold mb-2 text-black">
              {isEditing ? "Edit Entry" : "Add New Entry"}
            </h2>

            <div className="flex mb-4 space-x-2">
              <div className="flex-1">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Title
                </label>
                <input
                  id="title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                  value={newEntry.title || ""}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                  placeholder="Entry title"
                />
              </div>
              <div className="flex-1">
                <label
                  htmlFor="mood"
                  className="block text-sm font-medium text-black mb-1"
                >
                  Mood
                </label>
                <select
                  id="mood"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
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
            </div>

            <div className="mb-4">
              <button
                type="button"
                onClick={getRandomPrompt}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center text-sm"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Get Prompt
              </button>
              {showPrompt && (
                <div className="mt-2 p-2 bg-yellow-100 rounded-md">
                  <p className="text-xs italic mb-1 text-black">
                    {currentPrompt}
                  </p>
                  <button
                    onClick={() => setShowPrompt(false)}
                    className="text-xs text-gray-600 hover:text-gray-800"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="block text-sm font-medium text-black mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={newEntry.description || ""}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, description: e.target.value })
                }
                placeholder="Entry description"
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex-1">
                <input
                  id="date"
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
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
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {isEditing ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="mt-4">
          <h3 className="font-bold mb-2 text-black">All Entries</h3>
          {entries
            .sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
                  <h4 className="font-semibold text-black">{entry.title}</h4>
                  <p className="text-sm text-black">
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
                    <p className="text-sm mt-1 text-black">
                      {entry.description}
                    </p>
                  )}
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

        <div className="mt-4">
          <div className="mb-4">
            <div className="flex items-center mb-2">
              <Search className="w-4 h-4 mr-2" />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              />
            </div>
            <div className="flex items-center mb-2">
              <Filter className="w-4 h-4 mr-2" />
              <select
                value={filterMood}
                onChange={(e) => setFilterMood(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
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
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md mr-2 text-black"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange((prev) => ({ ...prev, end: e.target.value }))
                }
                className="w-1/2 px-3 py-2 border border-gray-300 rounded-md text-black"
              />
            </div>
          </div>
        </div>
      </div>
      <div ref={mapContainer} className="flex-grow h-full" />
    </div>
  );
}