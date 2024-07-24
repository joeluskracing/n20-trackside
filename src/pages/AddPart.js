import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AddPart.css';

const AddPart = () => {
  const { state } = useLocation();
  const { carId, carName } = state || {};
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [entryType, setEntryType] = useState('text');
  const [displayLocation, setDisplayLocation] = useState([]);
  const [subheading, setSubheading] = useState('');
  const [stagedParts, setStagedParts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`Currently selected car: ${carId} - ${carName}`);
  }, [carId, carName]);

  const handleAddPart = () => {
    const locations = displayLocation.length > 1 ? displayLocation : [''];
    const newParts = locations.map((loc) => ({
      name: loc ? `${loc} ${name}` : name,
      carId,
      unit,
      entryType,
      displayLocation: loc,
      subheading,
      order: 1 // Default order value
    }));

    setStagedParts([...stagedParts, ...newParts]);
  };

  const handleStageChanges = () => {
    stagedParts.forEach((part) => {
      console.log('Adding part:', part);
      window.api.addPart(
        part.name,
        part.carId,
        part.unit,
        part.entryType,
        part.displayLocation,
        part.subheading,
        part.order
      ).catch(error => {
        console.error('Error adding part:', error);
      });
    });
    navigate('/'); // Navigate back to home after adding the parts
  };

  const handleRemovePart = (index) => {
    setStagedParts(stagedParts.filter((_, i) => i !== index));
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setDisplayLocation((prev) => {
        // Remove any selected radial if a checkbox is selected
        const newLocations = prev.filter(loc => !["Top Left", "Top Middle", "Top Right", "Engine", "Driver", "Center", "Passenger", "Differential", "Bottom Left", "Bottom Middle", "Bottom Right"].includes(loc));
        return [...newLocations, value];
      });
    } else {
      setDisplayLocation((prev) => prev.filter((loc) => loc !== value));
    }
  };

  const handleRadialChange = (e) => {
    const { value } = e.target;
    setDisplayLocation([value]); // Only allow one radial to be selected
  };

  return (
    <div className="add-part">
      <h2>Adding parts to {carName}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAddPart();
        }}
      >
        <input type="hidden" value={carId} />
        <label>
          Part Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Unit:
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="">Select a unit</option>
            <option value="Pounds">Pounds</option>
            <option value="Inches">Inches</option>
            <option value="Hole">Hole</option>
            <option value="Degrees">Degrees</option>
            <option value="Clicks">Clicks</option>
          </select>
        </label>
        <label>
          Entry Type:
          <select value={entryType} onChange={(e) => setEntryType(e.target.value)}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="table">Table</option>
          </select>
        </label>
        <label>
          Display Location:
          <div className="checkbox-group">
            <div>
              <label>
                <input
                  type="checkbox"
                  value="LF"
                  checked={displayLocation.includes("LF")}
                  onChange={handleCheckboxChange}
                /> LF
              </label>
              <label>
                <input
                  type="checkbox"
                  value="RF"
                  checked={displayLocation.includes("RF")}
                  onChange={handleCheckboxChange}
                /> RF
              </label>
              <label>
                <input
                  type="checkbox"
                  value="LR"
                  checked={displayLocation.includes("LR")}
                  onChange={handleCheckboxChange}
                /> LR
              </label>
              <label>
                <input
                  type="checkbox"
                  value="RR"
                  checked={displayLocation.includes("RR")}
                  onChange={handleCheckboxChange}
                /> RR
              </label>
            </div>
            <div>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Top Left"
                  checked={displayLocation.includes("Top Left")}
                  onChange={handleRadialChange}
                /> Top Left
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Top Middle"
                  checked={displayLocation.includes("Top Middle")}
                  onChange={handleRadialChange}
                /> Top Middle
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Top Right"
                  checked={displayLocation.includes("Top Right")}
                  onChange={handleRadialChange}
                /> Top Right
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Engine"
                  checked={displayLocation.includes("Engine")}
                  onChange={handleRadialChange}
                /> Engine
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Driver"
                  checked={displayLocation.includes("Driver")}
                  onChange={handleRadialChange}
                /> Driver
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Center"
                  checked={displayLocation.includes("Center")}
                  onChange={handleRadialChange}
                /> Center
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Passenger"
                  checked={displayLocation.includes("Passenger")}
                  onChange={handleRadialChange}
                /> Passenger
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Differential"
                  checked={displayLocation.includes("Differential")}
                  onChange={handleRadialChange}
                /> Differential
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Bottom Left"
                  checked={displayLocation.includes("Bottom Left")}
                  onChange={handleRadialChange}
                /> Bottom Left
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Bottom Middle"
                  checked={displayLocation.includes("Bottom Middle")}
                  onChange={handleRadialChange}
                /> Bottom Middle
              </label>
              <label>
                <input
                  type="radio"
                  name="displayLocation"
                  value="Bottom Right"
                  checked={displayLocation.includes("Bottom Right")}
                  onChange={handleRadialChange}
                /> Bottom Right
              </label>
            </div>
          </div>
        </label>
        <label>
          Subheading:
          <input
            type="text"
            value={subheading}
            onChange={(e) => setSubheading(e.target.value)}
            list="subheading-options"
          />
          <datalist id="subheading-options">
            <option value="Springs" />
            <option value="Shocks" />
            <option value="Alignment" />
            <option value="Tires" />
          </datalist>
        </label>
        <button type="submit">Stage Changes</button>
      </form>
      <div className="staged-parts">
        <h3>Staged Parts</h3>
        <ul>
          {stagedParts.map((part, index) => (
            <li key={index}>
              {part.name} 
              <button onClick={() => handleRemovePart(index)}>X</button>
            </li>
          ))}
        </ul>
        <button onClick={handleStageChanges}>Submit Changes</button>
      </div>
    </div>
  );
};

export default AddPart;
