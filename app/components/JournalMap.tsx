'use client'

import React, { useState, useRef, useEffect } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { MapPin, X, Trash2 } from 'lucide-react'

// Replace with your actual Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1Ijoic2thdmFsIiwiYSI6ImNtM25ncDE1MTBiZmUybG16MWZ6Y2RmcXEifQ.j1qvxxSCuvP83O01zizWAQ'

interface JournalEntry {
  id: number
  title: string
  mood: string
  location: [number, number]
  date: string
}

const moodToColor = {
  Happiness: '#FFFF00', // Yellow
  Calmness: '#0000FF', // Blue
  Energy: '#FF0000', // Red
  Sadness: '#808080', // Gray
  Envy: '#00FF00', // Green
  Creativity: '#800080', // Purple
  Warmth: '#FFA500', // Orange
  Serenity: '#40E0D0', // Turquoise
  Passion: '#8B0000', // Deep Red
  Nostalgia: '#8B4513', // Brown
  Anger: '#000000', // Black
  Confidence: '#FFD700', // Gold
  Peacefulness: '#98FB98', // Soft Green
  Mystery: '#4B0082', // Dark Purple
}

export default function JournalMap() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({})
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null)
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<{ [key: number]: mapboxgl.Marker }>({})
  const tempMarker = useRef<mapboxgl.Marker | null>(null)

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-122.2585, 37.8719],
      zoom: 14
    });
    map.current.on('load', () => {
      map.current!.on('click', (e) => {
        setSelectedLocation([e.lngLat.lng, e.lngLat.lat]);
        setNewEntry({});
        if (tempMarker.current) {
          tempMarker.current.remove();
        }
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundColor = '#808080'; // Grey color
        el.style.width = '20px';
        el.style.height = '20px';
        el.style.borderRadius = '50%';
        el.style.opacity = '0.7';
        tempMarker.current = new mapboxgl.Marker(el)
          .setLngLat([e.lngLat.lng, e.lngLat.lat])
          .addTo(map.current!);
      });
    });
    return () => map.current?.remove();
  }, []);

  useEffect(() => {
    if (!map.current) return
    Object.values(markers.current).forEach(marker => marker.remove())
    markers.current = {}
    entries.forEach(entry => {
      const el = document.createElement('div')
      el.className = 'marker'
      el.style.backgroundColor = moodToColor[entry.mood as keyof typeof moodToColor] || '#000000'
      el.style.width = '20px'
      el.style.height = '20px'
      el.style.borderRadius = '50%'
      const marker = new mapboxgl.Marker(el)
        .setLngLat(entry.location)
        .addTo(map.current!)
      marker.getElement().addEventListener('click', () => handleEntryClick(entry))
      markers.current[entry.id] = marker
    })
  }, [entries])

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEntry.title && selectedLocation && newEntry.mood) {
      const entry: JournalEntry = {
        id: Date.now(),
        title: newEntry.title,
        date: new Date().toISOString(),
        location: selectedLocation,
        mood: newEntry.mood,
      };
      setEntries(prevEntries => [...prevEntries, entry]);
      setNewEntry({});
      setSelectedLocation(null);
      if (tempMarker.current) {
        tempMarker.current.remove();
        tempMarker.current = null;
      }
    }
  };

  const handleEntryClick = (entry: JournalEntry) => {
    setNewEntry(entry)
    map.current?.flyTo({
      center: entry.location,
      zoom: 17
    })
  }

  const handleDeleteEntry = (id: number) => {
    setEntries(prevEntries => prevEntries.filter(entry => entry.id !== id));
    if (markers.current[id]) {
      markers.current[id].remove();
      delete markers.current[id];
    }
  }

  return (
    <div className="flex h-screen w-screen">
      <div className="w-96 h-full overflow-y-auto bg-white shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">UC Berkeley MindMap</h1>
        <p className="text-sm text-gray-600 mb-4">Click on the map to create a new entry.</p>
        {selectedLocation && (
          <form onSubmit={handleAddEntry} className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Add New Entry</h2>
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                id="title"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newEntry.title || ''}
                onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                placeholder="Entry title"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-1">
                Mood
              </label>
              <select
                id="mood"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newEntry.mood || ''}
                onChange={(e) => setNewEntry({ ...newEntry, mood: e.target.value })}
              >
                <option value="">Select a mood</option>
                {Object.entries(moodToColor).map(([mood, color]) => (
                  <option key={mood} value={mood} style={{backgroundColor: color, color: mood === 'Happiness' ? 'black' : 'white'}}>
                    {mood}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Save Entry
            </button>
          </form>
        )}
        <div className="mt-4">
          <h3 className="font-bold mb-2">Recent Entries</h3>
          {entries.map((entry) => (
            <div key={entry.id} className="p-2 border-b border-gray-200 hover:bg-gray-100">
              <div onClick={() => handleEntryClick(entry)} className="cursor-pointer">
                <h4 className="font-semibold">{entry.title}</h4>
                <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                  <span className="text-xs px-2 py-1 rounded-full" style={{ backgroundColor: moodToColor[entry.mood as keyof typeof moodToColor], color: entry.mood === 'Happiness' ? 'black' : 'white' }}>
                    {entry.mood}
                  </span>
                </div>
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
  )
}