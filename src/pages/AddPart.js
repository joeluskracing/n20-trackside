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
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    console.log(`Currently selected car: ${carId} - ${carName}`);
  }, [carId, carName]);

  const validateForm = () => {
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!entryType) newErrors.entryType = 'Entry Type is required';
    if (displayLocation.length === 0) newErrors.displayLocation = 'Display Location is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPart = () => {
    if (!validateForm()) return;

    const locations = displayLocation.length > 0 ? displayLocation : [''];
    const newParts = locations.map((loc) => ({
      name: displayLocation.length > 1 ? `${loc} ${name}` : name,
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
        const newLocations = prev.filter(loc => ![
          "Top Left", "Top Middle", "Top Right", 
          "Engine", "Driver", "Center", "Passenger", 
          "Differential", "Bottom Left", "Bottom Middle", 
          "Bottom Right"
        ].includes(loc));
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
        <label className="form-label">
          Subheading (Optional)
          <small>Use this to group each setting on each corner. For example, "Shocks" for Compression, Rebound, and Gas Pressure</small>
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
        <label className="form-label">
          Part Name <span className="required">*</span>
          <small>Name is required</small>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {errors.name && <span className="error">{errors.name}</span>}
        </label>
        <label className="form-label">
          Entry Type <span className="required">*</span>
          <small>This will determine the type of recording. Use "Table" for graphs such as spring smashing graphs, and Text for more complicated notes</small>
          <select value={entryType} onChange={(e) => setEntryType(e.target.value)} required>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="table">Table</option>
          </select>
          {errors.entryType && <span className="error">{errors.entryType}</span>}
        </label>
        <label className="form-label">
          Unit (Optional)
          <small>If the option is a number, use unit to display a unit next to the setting</small>
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="">Select a unit</option>
            <option value="Pounds">Pounds</option>
            <option value="Inches">Inches</option>
            <option value="Hole">Hole</option>
            <option value="Degrees">Degrees</option>
            <option value="Clicks">Clicks</option>
          </select>
        </label>
        <label className="form-label">
          Display Location <span className="required">*</span>
          <small>Where on the setup sheet this part will show up. You can select multiple corners at once to duplicate a part across up to all four corners</small>
          <div className="checkbox-group">
            <div>
              <label>LF</label>
              <input
                type="checkbox"
                value="LF"
                checked={displayLocation.includes("LF")}
                onChange={handleCheckboxChange}
              />
            </div>
            <div>
              <label>RF</label>
              <input
                type="checkbox"
                value="RF"
                checked={displayLocation.includes("RF")}
                onChange={handleCheckboxChange}
              />
            </div>
            <div>
              <label>LR</label>
              <input
                type="checkbox"
                value="LR"
                checked={displayLocation.includes("LR")}
                onChange={handleCheckboxChange}
              />
            </div>
            <div>
              <label>RR</label>
              <input
                type="checkbox"
                value="RR"
                checked={displayLocation.includes("RR")}
                onChange={handleCheckboxChange}
              />
            </div>
            <div>
              <label>Top Left</label>
              <input
                type="radio"
                name="displayLocation"
                value="Top Left"
                checked={displayLocation.includes("Top Left")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Top Middle</label>
              <input
                type="radio"
                name="displayLocation"
                value="Top Middle"
                checked={displayLocation.includes("Top Middle")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Top Right</label>
              <input
                type="radio"
                name="displayLocation"
                value="Top Right"
                checked={displayLocation.includes("Top Right")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Engine</label>
              <input
                type="radio"
                name="displayLocation"
                value="Engine"
                checked={displayLocation.includes("Engine")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Driver</label>
              <input
                type="radio"
                name="displayLocation"
                value="Driver"
                checked={displayLocation.includes("Driver")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Center</label>
              <input
                type="radio"
                name="displayLocation"
                value="Center"
                checked={displayLocation.includes("Center")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Passenger</label>
              <input
                type="radio"
                name="displayLocation"
                value="Passenger"
                checked={displayLocation.includes("Passenger")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Differential</label>
              <input
                type="radio"
                name="displayLocation"
                value="Differential"
                checked={displayLocation.includes("Differential")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Bottom Left</label>
              <input
                type="radio"
                name="displayLocation"
                value="Bottom Left"
                checked={displayLocation.includes("Bottom Left")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Bottom Middle</label>
              <input
                type="radio"
                name="displayLocation"
                value="Bottom Middle"
                checked={displayLocation.includes("Bottom Middle")}
                onChange={handleRadialChange}
              />
            </div>
            <div>
              <label>Bottom Right</label>
              <input
                type="radio"
                name="displayLocation"
                value="Bottom Right"
                checked={displayLocation.includes("Bottom Right")}
                onChange={handleRadialChange}
              />
            </div>
          </div>
          {errors.displayLocation && <span className="error">{errors.displayLocation}</span>}
        </label>
        <button type="submit" disabled={!name || !entryType || displayLocation.length === 0}>Stage Changes</button>
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
        <button id="btnFormSubmit" onClick={handleStageChanges} disabled={stagedParts.length === 0}>Submit Changes</button>
      </div>
    </div>
  );
};
export default AddPart;