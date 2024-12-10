import React, { useState, useEffect } from 'react';
import { StandaloneSearchBox } from '@react-google-maps/api';
import { TextField } from '@mui/material';

const libraries = ['places'];

const PlacesAutocomplete = ({ 
  label, 
  onSelect, 
  initialValue = '' 
}) => {
  const [searchBox, setSearchBox] = useState(null);
  const [inputValue, setInputValue] = useState(initialValue);

  useEffect(() => {
    if (initialValue) {
      setInputValue(initialValue);
    }
  }, [initialValue]);

  const handleLoad = (ref) => {
    setSearchBox(ref);
  };

  const handlePlacesChanged = () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry) {
          onSelect({
            address: place.formatted_address,
            coordinates: [
              place.geometry.location.lng(),
              place.geometry.location.lat(),
            ],
          });
          setInputValue(place.formatted_address);
        }
      }
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  return (
    <StandaloneSearchBox
      onLoad={handleLoad}
      onPlacesChanged={handlePlacesChanged}
    >
      <TextField
        fullWidth
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter location"
        sx={{ bgcolor: 'background.paper' }}
      />
    </StandaloneSearchBox>
  );
};

export default PlacesAutocomplete;
