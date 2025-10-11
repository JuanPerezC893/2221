import React, { useState, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getSuggestions, retrieveSuggestion } from '../api/geocoding';
import { debounce } from '../utils/debounce';
import './AddressAutocomplete.css';

const AddressAutocomplete = ({ value, onValueChange, onAddressSelect, placeholder, name, required, fetchFullDetails = false }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const sessionToken = useRef(uuidv4());

  const fetchSuggestions = useCallback(debounce(async (query) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getSuggestions(query, sessionToken.current);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  }, 300), []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onValueChange(newValue);
    fetchSuggestions(newValue);
  };

  const handleSuggestionClick = async (suggestion) => {
    if (fetchFullDetails) {
      setIsLoading(true);
      try {
        const fullAddress = await retrieveSuggestion(suggestion.mapbox_id, sessionToken.current);
        onAddressSelect(fullAddress); // Pass the entire object
      } catch (error) {
        console.error('Error retrieving suggestion:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      // If not fetching full details, just use the suggestion's text
      onAddressSelect(suggestion.place_name);
    }
    setSuggestions([]); // Clear suggestions after selection
  };

  return (
    <div className="address-autocomplete-container">
      <input
        type="text"
        className="form-control"
        name={name}
        value={value}
        onChange={handleInputChange}
        required={required}
        autoComplete="off"
        placeholder={placeholder || 'Ej: Av. Providencia 123, Santiago'}
      />
      {suggestions.length > 0 && (
        <ul className="list-group suggestions-list">
          {suggestions.map((s) => (
            <li key={s.mapbox_id} className="list-group-item list-group-item-action" onClick={() => handleSuggestionClick(s)}>
              <strong>{s.name}</strong>
              <div className="text-muted small">{s.place_name}</div>
            </li>
          ))}
        </ul>
      )}
      {isLoading && <div className="form-text"></div>}
    </div>
  );
};

export default AddressAutocomplete;
