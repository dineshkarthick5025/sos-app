import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FaArrowLeft, FaSearch, FaTimes } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './MapOperationPage.css';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapOperationsPage = () => {
  const [position, setPosition] = useState([28.6139, 77.2090]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef();
  const searchTimeoutRef = useRef();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const newPos = [pos.coords.latitude, pos.coords.longitude];
          setPosition(newPos);
          flyToLocation(newPos);
        },
        (err) => console.log("Geolocation error:", err)
      );
    }
  }, []);

  // Fly to location function
  const flyToLocation = useCallback((coords, zoom = 15) => {
    if (mapRef.current) {
      mapRef.current.flyTo(coords, zoom, {
        duration: 1,
        easeLinearity: 0.25
      });
    }
  }, []);

  // Search handler with debounce
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5`
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search input handler
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(query);
    }, 500);
  };

  // Clear search results
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  // Custom search result icon
  const searchIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <div className="map-operations-container">
      {/* Back Button */}
      <Link to="/features" className="back-button">
        <FaArrowLeft /> Back to Features
      </Link>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search for places..."
            value={searchQuery}
            onChange={handleSearchInputChange}
          />
          {searchQuery && (
            <button className="clear-button" onClick={clearSearch}>
              <FaTimes />
            </button>
          )}
        </div>
        
        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((result, i) => (
              <div 
                key={i} 
                className="search-result-item"
                onClick={() => {
                  const coords = [parseFloat(result.lat), parseFloat(result.lon)];
                  flyToLocation(coords);
                  setSearchQuery(result.display_name);
                  setSearchResults([]);
                }}
              >
                <div className="result-name">{result.display_name.split(',')[0]}</div>
                <div className="result-address">
                  {result.display_name.split(',').slice(1, 3).join(',')}
                </div>
              </div>
            ))}
          </div>
        )}
        {isSearching && <div className="search-loading">Searching...</div>}
      </div>

      {/* Map Container */}
      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ height: '100vh', width: '100%' }}
        whenCreated={(map) => { mapRef.current = map; }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Current Location Marker */}
        <Marker position={position}>
          <Popup>Your Location</Popup>
        </Marker>

        {/* Search Result Markers */}
        {searchResults.map((result, i) => (
          <Marker
            key={`result-${i}`}
            position={[parseFloat(result.lat), parseFloat(result.lon)]}
            icon={searchIcon}
          >
            <Popup>
              <strong>{result.display_name.split(',')[0]}</strong><br />
              {result.display_name.split(',').slice(1).join(',')}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapOperationsPage;