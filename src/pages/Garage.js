import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Garage.css';

const Garage = () => {
  const { state } = useLocation();
  const { carId, carName } = state || {};
  const [parts, setParts] = useState([]);
  const [groupedParts, setGroupedParts] = useState({});
  const [sessions, setSessions] = useState([]);
  const [values, setValues] = useState({});
  const [showTableLightbox, setShowTableLightbox] = useState(false);
  const [currentPart, setCurrentPart] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (carId) {
      loadParts();
    }
  }, [carId]);

  const loadParts = async () => {
    try {
      const fetchedParts = await window.api.getParts(carId);
      const partsValues = await window.api.getPartsValues();
      const uniqueParts = ensureUniqueOrder(fetchedParts);
      const sortedParts = uniqueParts.sort((a, b) => a.order - b.order);
      setParts(sortedParts);
      groupPartsByLocation(sortedParts);
      initializeValues(partsValues);
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
      window.api.updatePartOrder(part.id, part.order);
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

  const initializeValues = (partsValues) => {
    const initialValues = partsValues.reduce((acc, partValue) => {
      acc[partValue.partId] = partValue.value;
      return acc;
    }, {});
    setValues(initialValues);
  };

  const handleChange = (partId, value) => {
    setValues({ ...values, [partId]: value });
  };

  const handleIncrement = (partId) => {
    setValues({ ...values, [partId]: (values[partId] || 0) + 1 });
  };

  const handleDecrement = (partId) => {
    setValues({ ...values, [partId]: (values[partId] || 0) - 1 });
  };

  const handleTableLinkClick = (part) => {
    setCurrentPart(part);
    setShowTableLightbox(true);
  };

  const handleTableLightboxClose = () => {
    setShowTableLightbox(false);
    setCurrentPart(null);
  };

  const handleSubmit = async () => {
    const today = new Date().toISOString().split('T')[0];

    let event = await window.api.getEventByDate(today);
    if (!event) {
      event = await window.api.addEvent(`Garage on ${today}`, today);
    }

    const session = await window.api.addSession(event.id, today, 'garage');

    await window.api.addSessionPartsValue(session.id, values);

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
    <div className="garage">
      <div className="left-column">
        <h2>Garage Mode</h2>
        <table>
          <thead>
            <tr>
              <th>Sessions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => (
              <tr key={index}>
                <td>{session.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="right-column">
        <button onClick={handleSubmit} disabled={parts.length === 0}>Submit</button>
        <div className="parts-grid">
          {displayGrid.flat().map((location) => (
            <div key={location} className="grid-cell">
              <h3>{location}</h3>
              {groupedParts[location] && Object.keys(groupedParts[location]).map((subheading) => (
                <div key={subheading}>
                  <h4>{subheading}</h4>
                  <ul>
                    {groupedParts[location][subheading].map((part, index) => (
                      <li key={part.id}>
                        {part.name}
                        {part.entryType === 'text' && (
                          <input
                            type="text"
                            value={values[part.id] || ''}
                            onChange={(e) => handleChange(part.id, e.target.value)}
                          />
                        )}
                        {part.entryType === 'number' && (
                          <div className="number-input">
                            <button onClick={() => handleDecrement(part.id)}>-</button>
                            <input
                              type="number"
                              value={values[part.id] || 0}
                              onChange={(e) => handleChange(part.id, Number(e.target.value))}
                            />
                            <button onClick={() => handleIncrement(part.id)}>+</button>
                          </div>
                        )}
                        {part.entryType === 'table' && (
                          <button onClick={() => handleTableLinkClick(part)}>Table</button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      {showTableLightbox && (
        <div className="lightbox">
          <div className="lightbox-content">
            <h2>{currentPart.name} Table</h2>
            {/* Add your table content here */}
            <button onClick={handleTableLightboxClose}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Garage;
