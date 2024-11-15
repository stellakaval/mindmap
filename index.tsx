'use client'

import React, { useState, useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as Card from '@radix-ui/react-card';
import * as Button from '@radix-ui/react-button';
import * as Form from '@radix-ui/react-form';
import * as Select from '@radix-ui/react-select';
import * as Badge from '@radix-ui/react-badge';
import { Plus, MapPin } from 'lucide-react';

// Replace with your actual Mapbox access token
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

// Define the structure for a journal entry
interface JournalEntry {
  id: number;
  title: string;
  content: string;
  date: string;
  location: [number, number];
  locationTag: string;
  mood: string;
}

// Custom marker colors
const colorToHex: { [key: string]: string } = {
  red: '#FF0000',
  blue: '#0000FF',
  green: '#00FF00',
  yellow: '#FFFF00',
  purple: '#800080',
};

// Predefined location tags for UC Berkeley campus
const locationTags = [
  "Sather Gate",
  "Doe Library",
  "Campanile",
  "Memorial Stadium",
  "Sproul Plaza",
  "Berkeley Way West",
  "Cory Hall",
  "Dwinelle Hall",
  "Haas Pavilion",
  "Other"
];

export default function JournalMap() {
  const [entries, setEntries] = useState<JournalEntry[]>([]); // Fixed to JournalEntry[]
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({});
  const [selectedLocation, setSelectedLocation] = useState<[number, number] | null>(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<{ [key: number]: mapboxgl.Marker }>({});

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-122.2585, 37.8719], // UC Berkeley coordinates
      zoom: 14
    });

    map.current.on('load', () => {
      map.current!.on('click', (e) => {
        setSelectedLocation([e.lngLat.lng, e.lngLat.lat]);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    Object.values(markers.current).forEach(marker => marker.remove());
    markers.current = {};

    // Add markers for each entry
    entries.forEach(entry => {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = colorToHex[entry.mood] || '#000000';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';

      const marker = new mapboxgl.Marker(el)
        .setLngLat(entry.location)
        .addTo(map.current!);

      marker.getElement().addEventListener('click', () => handleEntryClick(entry));

      markers.current[entry.id] = marker;
    });

    // Add marker for selected location
    if (selectedLocation) {
      const el = document.createElement('div');
      el.className = 'marker';
      el.style.backgroundColor = '#000000';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.opacity = '0.5';

      new mapboxgl.Marker(el)
        .setLngLat(selectedLocation)
        .addTo(map.current);
    }
  }, [entries, selectedLocation]);

  const handleAddEntry = () => {
    if (newEntry.title && newEntry.content && selectedLocation && newEntry.locationTag) {
      const entry: JournalEntry = {
        id: Date.now(),
        title: newEntry.title,
        content: newEntry.content,
        date: new Date().toISOString(),
        location: selectedLocation,
        locationTag: newEntry.locationTag,
        mood: newEntry.mood || 'blue',
      };
      setEntries([...entries, entry]);
      setNewEntry({});
      setSelectedLocation(null);
      setIsAddingEntry(false);
    }
  };

  const handleEntryClick = (entry: JournalEntry) => {
    setNewEntry(entry);
    setIsAddingEntry(true);
    map.current?.flyTo({
      center: entry.location,
      zoom: 17
    });
  };

  return (
    <div className="flex h-screen w-screen">
      <Card.Root className="w-96 h-full overflow-y-auto">
        <Card.Header>
          <Card.Title>UC Berkeley Journal</Card.Title>
        </Card.Header>
        <Card.Content>
          <Button.Root onClick={() => setIsAddingEntry(!isAddingEntry)}>
            <Plus className="mr-2 h-4 w-4" /> New Entry
          </Button.Root>
          {isAddingEntry && (
            <Form.Root className="mt-4 space-y-4" onSubmit={(e: { preventDefault: () => void; }) => { e.preventDefault(); handleAddEntry(); }}>
              <Form.Field name="title">
                <Form.Label>Title</Form.Label>
                <Form.Control asChild>
                  <input
                    value={newEntry.title || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    placeholder="Entry title"
                  />
                </Form.Control>
              </Form.Field>
              <Form.Field name="content">
                <Form.Label>Content</Form.Label>
                <Form.Control asChild>
                  <textarea
                    value={newEntry.content || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                    placeholder="Your journal entry"
                  />
                </Form.Control>
              </Form.Field>
              <Form.Field name="locationTag">
                <Form.Label>Location Tag</Form.Label>
                <Select.Root onValueChange={(value: any) => setNewEntry({ ...newEntry, locationTag: value })}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select a location" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content>
                      {locationTags.map((tag) => (
                        <Select.Item key={tag} value={tag}>{tag}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </Form.Field>
              <Form.Field name="mood">
                <Form.Label>Mood</Form.Label>
                <Select.Root onValueChange={(value: any) => setNewEntry({ ...newEntry, mood: value })}>
                  <Select.Trigger>
                    <Select.Value placeholder="Select a mood" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content>
                      <Select.Item value="red">Red (Angry)</Select.Item>
                      <Select.Item value="blue">Blue (Sad)</Select.Item>
                      <Select.Item value="green">Green (Happy)</Select.Item>
                      <Select.Item value="yellow">Yellow (Excited)</Select.Item>
                      <Select.Item value="purple">Purple (Anxious)</Select.Item>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </Form.Field>
              <Form.Submit asChild>
                <Button.Root>Save Entry</Button.Root>
              </Form.Submit>
            </Form.Root>
          )}
          <div className="mt-4">
            <h3 className="font-bold mb-2">Recent Entries</h3>
            {entries.map((entry) => (
              <div 
                key={entry.id} 
                className="p-2 border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                onClick={() => handleEntryClick(entry)}
              >
                <h4 className="font-semibold">{entry.title}</h4>
                <p className="text-sm text-gray-600">{new Date(entry.date).toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <MapPin className="w-4 h-4 mr-1 text-gray-500" />
                  <Badge.Root>{entry.locationTag}</Badge.Root>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      </Card.Root>
      <div ref={mapContainer} className="flex-grow h-full" />
    </div>
  );
}
