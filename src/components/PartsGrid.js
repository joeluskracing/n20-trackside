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
  return (
    <div className="parts-grid">
      {gridLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="grid-row">
          {row.map((location) => {
            const hasParts =
              groupedParts[location] &&
              Object.values(groupedParts[location]).some(
                (arr) => Array.isArray(arr) && arr.length > 0
              );

            if (!hasParts) {
              return <div key={location} className="grid-cell placeholder" />;
            }

            return (
              <div key={location} className="grid-cell">
                <h3>{location}</h3>
                {Object.keys(groupedParts[location] || {}).map((subheading) => (
                  <div key={subheading}>
                    <h4>{subheading}</h4>
                    <ul>
                      {(groupedParts[location][subheading] || [])
                        .filter(
                          (part) =>
                            showAll ||
                            part.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                        )
                        .map((part) => (
                          <li key={part.id}>
                            {part.name}
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
                                <button
                                  onClick={() => handleDecrement(part.id)}
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  value={values[part.id] || 0}
                                  onChange={(e) =>
                                    handleChange(part.id, Number(e.target.value))
                                  }
                                />
                                <button
                                  onClick={() => handleIncrement(part.id)}
                                >
                                  +
                                </button>
                              </div>
                            )}
                            {part.entryType === 'table' && (
                              <button
                                onClick={() => handleTableLinkClick(part)}
                              >
                                Table
                              </button>
                            )}
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
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
