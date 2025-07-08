import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ModifyParts.css';
import '../components/PartsGrid.css';
import { useCar } from '../context/CarContext';

const ModifyParts = () => {
  const { selectedCar: carId, carName } = useCar();
  const [parts, setParts] = useState([]);
  const [groupedParts, setGroupedParts] = useState({});
  const [stagedDeletions, setStagedDeletions] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (carId) {
      loadParts();
    }
  }, [carId]);

  const loadParts = async () => {
    try {
      const fetchedParts = await window.api.getParts(carId);
      const uniqueParts = ensureUniqueOrder(fetchedParts);
      const sortedParts = uniqueParts.sort((a, b) => a.order - b.order);
      setParts(sortedParts);
      groupPartsByLocation(sortedParts);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const ensureUniqueOrder = (parts) => {
    const orderMap = new Map();
    let orderValue = 1;

    parts.forEach((part) => {
      const key = `${part.displayLocation}-${part.subheading || 'Others'}`;
      if (!orderMap.has(key)) {
        orderMap.set(key, new Set());
      }
      orderMap.get(key).add(part.order);
    });

    parts.forEach((part) => {
      const key = `${part.displayLocation}-${part.subheading || 'Others'}`;
      while (orderMap.get(key).has(orderValue)) {
        orderValue++;
      }
      if (!part.order || orderMap.get(key).has(part.order)) {
        part.order = orderValue;
        orderMap.get(key).add(orderValue);
      }
      orderValue++;
    });

    parts.forEach((part) => {
      if (!part.order) {
        window.api.updatePartOrder(part.id, part.order);
      }
    });

    return parts;
  };

  const groupPartsByLocation = (parts) => {
    const grouped = parts.reduce((acc, part) => {
      const location = part.displayLocation;
      const subheading = part.subheading?.trim() || 'Others';
      if (!acc[location]) {
        acc[location] = {};
      }
      if (!acc[location][subheading]) {
        acc[location][subheading] = [];
      }
      acc[location][subheading].push(part);
      return acc;
    }, {});
    setGroupedParts(grouped);
  };

  const movePart = (partId, direction, location, subheading) => {
    const newParts = [...parts];
    const group = newParts.filter(part => part.displayLocation === location && (part.subheading?.trim() || 'Others') === subheading);
    const index = group.findIndex(part => part.id === partId);

    if (index < 0) return;

    if (direction === 'up' && index > 0) {
      [group[index].order, group[index - 1].order] = [group[index - 1].order, group[index].order];
    } else if (direction === 'down' && index < group.length - 1) {
      [group[index].order, group[index + 1].order] = [group[index + 1].order, group[index].order];
    }

    const updatedParts = newParts.map(part => {
      const updatedPart = group.find(gPart => gPart.id === part.id);
      return updatedPart ? updatedPart : part;
    }).sort((a, b) => a.order - b.order);

    setParts(updatedParts);
    groupPartsByLocation(updatedParts);
  };

  const saveReorderedParts = () => {
    console.log('Save button pressed');
    parts.forEach((part) => {
      console.log(`Saving part order: ${part.id} - ${part.order}`);
      window.api.updatePartOrder(part.id, part.order);
    });
    console.log('Changes saved successfully.');
    alert('Changes saved successfully.');
  };

  const stageDeletion = (partId) => {
    const newParts = parts.filter(part => part.id !== partId);
    const stagedPart = parts.find(part => part.id === partId);

    setParts(newParts);
    setStagedDeletions([...stagedDeletions, stagedPart]);
    groupPartsByLocation(newParts);
  };

  const cancelDeletion = (partId) => {
    const partToRestore = stagedDeletions.find(part => part.id === partId);
    const newStagedDeletions = stagedDeletions.filter(part => part.id !== partId);
    
    const newParts = [...parts, partToRestore].sort((a, b) => a.order - b.order);

    setParts(newParts);
    setStagedDeletions(newStagedDeletions);
    groupPartsByLocation(newParts);
  };

  const handleDeleteConfirm = () => {
    stagedDeletions.forEach(async (part) => {
      await window.api.deletePart(part.id);
    });
    navigate('/');
  };

  const displayGrid = [
    ["Top Left", "Top Middle", "Top Right"],
    ["LF", "Engine", "RF"],
    ["Driver", "Center", "Passenger"],
    ["LR", "Differential", "RR"],
    ["Bottom Left", "Bottom Middle", "Bottom Right"],
  ];

  return (
    <div className="modify-parts">
      <div className="grid-box">
        <h2>Parts Layout</h2>
        <button className="save-changes" onClick={saveReorderedParts}>Save Changes</button>
        {stagedDeletions.length > 0 && (
          <div className="staged-deletions">
            <h3>Staged Deletions</h3>
            <ul>
              {stagedDeletions.map((part) => (
                <li key={part.id}>
                  <button onClick={() => cancelDeletion(part.id)}>Cancel</button>
                  {part.name}
                </li>
              ))}
            </ul>
            <button onClick={() => setShowWarning(true)}>Submit Deletions</button>
          </div>
        )}
        <div className="parts-grid">
          {displayGrid.map((row, rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {row.map((location) => (
                <div key={location} className="grid-cell">
                  <h3>{location}</h3>
                  {groupedParts[location] && Object.keys(groupedParts[location]).map((subheading) => (
                    <div key={subheading}>
                      <h4>{subheading}</h4>
                      <ul>
                        {groupedParts[location][subheading].map((part) => (
                          <li key={part.id} className="part-item">
                            <span className="part-name">{part.name}</span>
                            <span className="part-controls">
                              <button onClick={() => stageDeletion(part.id)}>X</button>
                              <button onClick={() => movePart(part.id, 'up', location, subheading)}>&uarr;</button>
                              <button onClick={() => movePart(part.id, 'down', location, subheading)}>&darr;</button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {showWarning && (
        <div className="lightbox">
          <div className="lightbox-content">
            <h2>WARNING</h2>
            <p>ALL DELETED PARTS WILL LOSE ALL ASSOCIATED SESSION AND EVENT DATA. THERE IS NO RECOVERY FOR THIS! DO YOU WISH TO PROCEED?</p>
            <button onClick={handleDeleteConfirm}>Yes</button>
            <button onClick={() => setShowWarning(false)}>No</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModifyParts;
