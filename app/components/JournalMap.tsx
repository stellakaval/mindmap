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
  Happiness: "#FFD700", // Bright gold
  Joy: "#FFA500", // Vibrant orange
  Excitement: "#FF4500", // Vivid red-orange
  Love: "#FF1493", // Deep pink
  Passion: "#FF0000", // Pure red
  Energy: "#FF4D00", // Bright orange-red
  Confidence: "#FF8C00", // Dark orange
  Warmth: "#FF7F50", // Coral
  Creativity: "#9932CC", // Dark orchid
  Inspiration: "#8A2BE2", // Blue violet
  Calmness: "#4169E1", // Royal blue
  Serenity: "#40E0D0", // Turquoise
  Peacefulness: "#98FB98", // Pale green
  Tranquility: "#E0FFFF", // Light cyan
  Sadness: "#4682B4", // Steel blue
  Melancholy: "#708090", // Slate gray
  Nostalgia: "#DEB887", // Burlywood
  Contemplation: "#778899", // Light slate gray
  Anxiety: "#9ACD32", // Yellow-green
  Stress: "#ADFF2F", // Green-yellow
  Fear: "#800080", // Purple
  Anger: "#8B0000", // Dark red
  Rage: "#B22222", // Firebrick red
  Envy: "#00A86B", // Jade green
  Jealousy: "#228B22", // Forest green
  Mystery: "#4B0082", // Indigo
  Intrigue: "#483D8B", // Dark slate blue
  Boredom: "#A9A9A9", // Dark gray
  Apathy: "#D3D3D3", // Light gray
  Disgust: "#556B2F", // Dark olive green
};

const getMoodEmoji = (mood: string) => {
  const emojiMap: { [key: string]: string } = {
    Happiness: "😊",
    Joy: "😄",
    Excitement: "🤩",
    Love: "❤️",
    Passion: "🔥",
    Energy: "⚡",
    Confidence: "💪",
    Warmth: "🌞",
    Creativity: "🎨",
    Inspiration: "💡",
    Calmness: "😌",
    Serenity: "🧘",
    Peacefulness: "🕊️",
    Tranquility: "🌿",
    Sadness: "😢",
    Melancholy: "🥀",
    Nostalgia: "🕰️",
    Contemplation: "🤔",
    Anxiety: "😰",
    Stress: "😓",
    Fear: "😨",
    Anger: "😠",
    Rage: "🤬",
    Envy: "😒",
    Jealousy: "💚",
    Mystery: "🕵️",
    Intrigue: "🧐",
    Boredom: "😑",
    Apathy: "😐",
    Disgust: "🤢",
  };
  return emojiMap[mood] || "";
};

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

      // Create a radial gradient
      const color =
        moodToColor[entry.mood as keyof typeof moodToColor] || "#000000";
      el.style.background = `radial-gradient(circle, ${color} 0%, rgba(255,255,255,0) 70%)`;
      el.style.width = "40px";
      el.style.height = "40px";
      el.style.borderRadius = "50%";
      el.style.opacity = "0.8";

      const marker = new mapboxgl.Marker(el)
        .setLngLat(entry.location)
        .addTo(map.current!);
      marker
        .getElement()
        .addEventListener("click", () => handleEntryClick(entry));
      markers.current[entry.id] = marker;
    });
  }, [entries, searchTerm, filterMood, dateRange]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      newEntry.title &&
      selectedLocation &&
      newEntry.mood &&
      newEntry.description
    ) {
      const entry: JournalEntry = {
        id: isEditing ? (newEntry.id as number) : Date.now(),
        title: newEntry.title,
        date: newEntry.date || new Date().toISOString(),
        location: selectedLocation,
        mood: newEntry.mood,
        description: newEntry.description,
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
    } else {
      alert("Please fill out all fields before submitting.");
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
          Map your journey of emotions. Click anywhere on the map to pin a
          memory, capturing your mood, location, and personal reflections. Each
          marker tells a story of your experiences across Berkeley's landscape.
        </p>

        {selectedLocation && (
          <form
            onSubmit={handleAddEntry}
            className="mb-4 bg-gray-100 p-4 rounded-lg"
          >
            <h2 className="text-lg font-semibold mb-2 text-black">
              {isEditing ? "Edit Entry" : "Add New Entry"}
            </h2>

            <div className="mb-4">
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
                required
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
                    {mood} {getMoodEmoji(mood)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-black mb-1"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black font-bold mb-2"
                value={newEntry.title || ""}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, title: e.target.value })
                }
                placeholder="Enter title"
                required
              />
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
                placeholder="Enter your description"
                rows={4}
                required
                maxLength={200}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="date"
                className="block text-sm font-medium text-black mb-1"
              >
                Date
              </label>
              <input
                id="date"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                value={
                  newEntry.date
                    ? new Date(newEntry.date).toISOString().split("T")[0]
                    : new Date().toISOString().split("T")[0]
                }
                onChange={(e) =>
                  setNewEntry({
                    ...newEntry,
                    date: new Date(e.target.value).toISOString(),
                  })
                }
                required
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {isEditing ? "Update" : "Submit"}
            </button>
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
      </div>

      <div ref={mapContainer} className="flex-grow h-full" />

      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md max-w-xs">
        <h3 className="text-lg font-semibold mb-2 text-black">
          Filter Entries
        </h3>
        <div className="mb-2">
          <div className="flex items-center mb-2">
            <Search className="w-4 h-4 mr-2" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md text-black"
            />
          </div>
          <div className="flex items-center mb-2">
            <Filter className="w-4 h-4 mr-2" />
            <select
              value={filterMood}
              onChange={(e) => setFilterMood(e.target.value)}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md text-black"
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
              className="w-1/2 px-2 py-1 text-sm border border-gray-300 rounded-md mr-2 text-black"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, end: e.target.value }))
              }
              className="w-1/2 px-2 py-1 text-sm border border-gray-300 rounded-md text-black"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
