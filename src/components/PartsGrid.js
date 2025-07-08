// PartsGrid.js
import React from 'react';
import PropTypes from 'prop-types';
import EditableTable from '../components/EditableTable';

const PartsGrid = ({
  gridLayout,
  groupedParts,
  values,
  handleChange,
  handleIncrement,
  handleDecrement,
  handleTableLinkClick,
  showAll,
  searchTerm,
}) => {
  const filterParts = (parts) =>
    parts.filter(
      (part) =>
        showAll ||
        part.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="parts-grid">
      {gridLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {row.map((location) => {
            const locationParts = groupedParts[location] || {};
            const hasParts = Object.values(locationParts).some(
              (arr) => Array.isArray(arr) && arr.length > 0
            );

            if (!hasParts) {
              return <div key={location} className="grid-cell placeholder" />;
            }

            // Determine if any parts in this location match the current search
            const hasVisibleParts = Object.keys(locationParts).some((sub) =>
              filterParts(locationParts[sub] || []).length > 0
            );

            if (!hasVisibleParts && searchTerm) {
              return null;
            }

            return (
              <div key={location} className="grid-cell">
                <h3>{location}</h3>
                {Object.keys(locationParts).map((subheading) => {
                  const filtered = filterParts(locationParts[subheading] || []);
                  if (filtered.length === 0 && !showAll && searchTerm) {
                    return null;
                  }
                  return (
                    <div key={subheading}>
                      <h4>{subheading}</h4>
                      <ul>
                        {filtered.map((part) => (
                          <li key={part.id} className="part-item">
                            <span className="part-name">{part.name}</span>
                            <span className="part-controls">
                              {part.entryType === 'text' && (
                                <input
                                  type="text"
                                  value={values[part.id] || ''}
                                  onChange={(e) =>
                                    handleChange(part.id, e.target.value)
                                  }
                                />
                              )}
                              {part.entryType === 'number' && (
                                <div className="number-input">
                                  <button onClick={() => handleDecrement(part.id)}>
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    value={values[part.id] || 0}
                                    onChange={(e) =>
                                      handleChange(part.id, Number(e.target.value))
                                    }
                                  />
                                  <button onClick={() => handleIncrement(part.id)}>
                                    +
                                  </button>
                                </div>
                              )}
                              {part.entryType === 'table' && (
                                <button onClick={() => handleTableLinkClick(part)}>
                                  Table
                                </button>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

PartsGrid.propTypes = {
  gridLayout: PropTypes.array.isRequired,
  groupedParts: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  handleIncrement: PropTypes.func.isRequired,
  handleDecrement: PropTypes.func.isRequired,
  handleTableLinkClick: PropTypes.func.isRequired,
  showAll: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
};

export default PartsGrid;
