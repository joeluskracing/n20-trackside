import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ManageParts.css';

const gridLayout = [
  ["Top Left", "Top Middle", "Top Right"],
  ["LF", "Engine", "RF"],
  ["Driver", "Center", "Passenger"],
  ["LR", "Differential", "RR"],
  ["Bottom Left", "Bottom Middle", "Bottom Right"],
];

const ManageParts = () => {
  const { state } = useLocation();
  const { carId, carName } = state || {};
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [entryType, setEntryType] = useState('text');
  const [displayLocation, setDisplayLocation] = useState([]);
  const [subheading, setSubheading] = useState('');

  const [parts, setParts] = useState([]);
  const [deletedParts, setDeletedParts] = useState([]);
  const [draggedPart, setDraggedPart] = useState(null);
  const [editingSub, setEditingSub] = useState(null);
  const [subEditValue, setSubEditValue] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (carId) {
      loadParts();
    }
  }, [carId]);

  const loadParts = async () => {
    const fetched = await window.api.getParts(carId);
    const sorted = fetched.sort((a, b) => a.order - b.order);
    setParts(sorted);
  };

  const groupParts = (partsList) => {
    return partsList.reduce((acc, part) => {
      const loc = part.displayLocation;
      const sub = part.subheading?.trim() || 'Others';
      if (!acc[loc]) acc[loc] = {};
      if (!acc[loc][sub]) acc[loc][sub] = [];
      acc[loc][sub].push(part);
      return acc;
    }, {});
  };

  const reorderParts = (updated) => {
    const grouped = groupParts(updated);
    Object.keys(grouped).forEach(loc => {
      Object.keys(grouped[loc]).forEach(sub => {
        grouped[loc][sub].sort((a,b) => a.order - b.order).forEach((p,i) => {
          p.order = i + 1;
        });
      });
    });
    return [...updated];
  };

  const handleAddPart = () => {
    const locs = displayLocation.length > 0 ? displayLocation : [''];
    const newParts = locs.map(loc => ({
      id: `new-${Date.now()}-${Math.random()}`,
      name: displayLocation.length > 1 ? `${loc} ${name}` : name,
      carId,
      unit,
      entryType,
      displayLocation: loc,
      subheading,
      order: parts.length + 1,
      isNew: true
    }));
    setParts(reorderParts([...parts, ...newParts]));
    setName('');
    setUnit('');
    setEntryType('text');
    setDisplayLocation([]);
    setSubheading('');
  };

  const handleDeletePart = async (part) => {
    if (!part.isNew) {
      const usage = await window.api.getPartUsage(part.id) || [];
      if (usage.length > 0) {
        const msg = 'This part has data in the following sessions:\n' +
          usage.map(u => `${u.event} ${new Date(u.date).toLocaleDateString()} (${u.session})`).join('\n') +
          '\nDeleting will remove these values. Continue?';
        if (!window.confirm(msg)) return;
      }
    }
    setParts(parts.filter(p => p.id !== part.id));
    if (!part.isNew) setDeletedParts([...deletedParts, part]);
  };

  const handleDragStart = (part) => {
    setDraggedPart(part);
  };

  const handleDropOnPart = (e, targetPart) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedPart || draggedPart.id === targetPart.id) return;

    const sameContainer =
      draggedPart.displayLocation === targetPart.displayLocation &&
      (draggedPart.subheading?.trim() || 'Others') ===
        (targetPart.subheading?.trim() || 'Others');

    const updated = parts.map((p) => {
      if (p.id === draggedPart.id) {
        return {
          ...p,
          displayLocation: targetPart.displayLocation,
          subheading: targetPart.subheading,
          order: targetPart.order,
        };
      }

      if (
        p.displayLocation === targetPart.displayLocation &&
        (p.subheading?.trim() || 'Others') ===
          (targetPart.subheading?.trim() || 'Others')
      ) {
        if (p.order >= targetPart.order) {
          return { ...p, order: p.order + 1 };
        }
      }
      return p;
    });

    setParts(reorderParts(updated));
    setDraggedPart(null);
  };

  const handleDropOnContainer = (e, location, sub) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedPart) return;
    const updated = parts.map(p =>
      p.id === draggedPart.id
        ? { ...p, displayLocation: location, subheading: sub }
        : p
    );
    setParts(reorderParts(updated));
    setDraggedPart(null);
  };

  const startEditSub = (loc, sub) => {
    setEditingSub({ loc, sub });
    setSubEditValue(sub);
  };

  const commitEditSub = () => {
    if (!editingSub) return;
    const { loc, sub } = editingSub;
    const updated = parts.map(p => (p.displayLocation === loc && (p.subheading?.trim() || 'Others') === sub) ? { ...p, subheading: subEditValue } : p);
    setParts(updated);
    setEditingSub(null);
  };

  const handleSave = async () => {
    for (const part of parts) {
      if (part.isNew) {
        await window.api.addPart(part.name, carId, part.unit, part.entryType, part.displayLocation, part.subheading, part.order);
      } else {
        await window.api.updatePart(part.id, { order: part.order, subheading: part.subheading, displayLocation: part.displayLocation });
      }
    }
    for (const part of deletedParts) {
      await window.api.deletePart(part.id);
    }
    navigate('/');
  };

  const groupedParts = groupParts(parts);

  return (
    <div className="manage-parts">
      <div className="form-panel">
        <h2>Add Parts to {carName}</h2>
        <form onSubmit={e => { e.preventDefault(); handleAddPart(); }}>
          <label className="form-label">
            Part Name
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </label>
          <label className="form-label">
            Entry Type
            <select value={entryType} onChange={e => setEntryType(e.target.value)} required>
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="table">Table</option>
            </select>
          </label>
          <label className="form-label">
            Display Location
            <div className="checkbox-group">
              {['LF','RF','LR','RR'].map(loc => (
                <div key={loc}>
                  <input type="checkbox" value={loc} checked={displayLocation.includes(loc)} onChange={e => setDisplayLocation(prev => e.target.checked ? [...prev, loc] : prev.filter(l => l!==loc))} />
                  <label>{loc}</label>
                </div>
              ))}
            </div>
          </label>
          <label className="form-label">
            Subheading
            <input type="text" value={subheading} onChange={e => setSubheading(e.target.value)} />
          </label>
          <label className="form-label">
            Unit
            <select value={unit} onChange={e => setUnit(e.target.value)}>
              <option value="">Select unit</option>
              <option value="Pounds">Pounds</option>
              <option value="Inches">Inches</option>
              <option value="Degrees">Degrees</option>
              <option value="Clicks">Clicks</option>
            </select>
          </label>
          <button type="submit">Stage Part</button>
        </form>
      </div>
      <div className="grid-panel">
        <h2>Parts Layout</h2>
        <div className="parts-grid">
          {gridLayout.map((row,rowIndex) => (
            <div key={rowIndex} className="grid-row">
              {row.map(location => (
                <div
                  key={location}
                  className="grid-cell"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDropOnContainer(e, location, 'Others')}
                >
                  <h3>{location}</h3>
                  {groupedParts[location] && Object.keys(groupedParts[location]).map(sub => (
                    <div
                      key={sub}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => handleDropOnContainer(e, location, sub)}
                    >
                      {editingSub && editingSub.loc===location && editingSub.sub===sub ? (
                        <input value={subEditValue} onChange={e => setSubEditValue(e.target.value)} onBlur={commitEditSub} onKeyDown={e => e.key==='Enter' && commitEditSub()} />
                      ) : (
                        <h4 onDoubleClick={() => startEditSub(location, sub)}>{sub}</h4>
                      )}
                      <ul>
                        {groupedParts[location][sub].sort((a,b)=>a.order-b.order).map(part => (
                          <li
                            key={part.id}
                            className="part-item"
                            draggable
                            onDragStart={() => handleDragStart(part)}
                            onDrop={e => handleDropOnPart(e, part)}
                            onDragOver={e => e.preventDefault()}
                          >
                            <span className="drag-handle">::</span> {part.name}
                            <button onClick={() => handleDeletePart(part)}>X</button>
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
        <button className="save-notes" onClick={handleSave}>Save Parts</button>
      </div>
    </div>
  );
};

export default ManageParts;