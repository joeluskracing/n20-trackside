import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './EditableTable.css'; // Make sure to create this CSS file

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EditableTable = ({ value, onChange }) => {
  const [tableData, setTableData] = useState(value ? JSON.parse(value) : { headers: [''], rows: [['']] });
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    onChange(JSON.stringify(tableData));
  }, [tableData]);

  const addColumn = () => {
    setTableData((prev) => ({
      ...prev,
      headers: [...prev.headers, `Header ${prev.headers.length + 1}`],
      rows: prev.rows.map((row) => [...row, ''])
    }));
  };

  const addRow = () => {
    setTableData((prev) => ({
      ...prev,
      rows: [...prev.rows, Array(prev.headers.length).fill('')]
    }));
  };

  const deleteColumn = (colIndex) => {
    setTableData((prev) => ({
      headers: prev.headers.filter((_, index) => index !== colIndex),
      rows: prev.rows.map((row) => row.filter((_, index) => index !== colIndex))
    }));
  };

  const deleteRow = (rowIndex) => {
    setTableData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, index) => index !== rowIndex)
    }));
  };

  const updateCell = (rowIndex, colIndex, value) => {
    setTableData((prev) => {
      const newRows = prev.rows.map((row, rIdx) =>
        row.map((cell, cIdx) => (rIdx === rowIndex && cIdx === colIndex ? value : cell))
      );
      return { ...prev, rows: newRows };
    });
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    if (e.key === 'Enter') {
      if (rowIndex === tableData.rows.length - 1) {
        addRow();
      }
    }
  };

  const validateAndGraph = () => {
    const { headers, rows } = tableData;
    const xAxis = headers[0];
    const yAxis = headers[1];
    
    const xValues = rows.map(row => parseFloat(row[0]));
    const yValues = rows.map(row => parseFloat(row[1]));

    if (xValues.every(val => !isNaN(val)) && yValues.every(val => !isNaN(val))) {
      setGraphData({
        labels: xValues,
        datasets: [
          {
            label: `${yAxis} vs ${xAxis}`,
            data: yValues,
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          },
        ],
      });
    } else {
      alert('The selected columns contain non-numeric values. Please ensure both columns contain only numbers.');
    }
  };

  return (
    <div>
      <table className="editable-table">
        <thead>
          <tr>
            {tableData.headers.map((header, index) => (
              <th key={index} style={{ backgroundColor: '#f0f0f0', position: 'relative' }}>
                <input
                  type="text"
                  value={header}
                  onChange={(e) => {
                    const newHeaders = [...tableData.headers];
                    newHeaders[index] = e.target.value;
                    setTableData({ ...tableData, headers: newHeaders });
                  }}
                />
                <button
                  style={{ position: 'absolute', top: 0, right: 0 }}
                  onClick={() => deleteColumn(index)}
                >
                  -
                </button>
              </th>
            ))}
            <th><button onClick={addColumn}>+</button></th>
          </tr>
        </thead>
        <tbody>
          {tableData.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex}>
                  <input
                    type="text"
                    value={cell}
                    onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                  />
                </td>
              ))}
              <td><button onClick={() => deleteRow(rowIndex)}>-</button></td>
            </tr>
          ))}
          <tr>
            <td colSpan={tableData.headers.length + 1}><button onClick={addRow}>+</button></td>
          </tr>
        </tbody>
      </table>
      <button onClick={validateAndGraph}>Show Graph</button>
      {graphData && (
        <div id="graph-container">
          <Line data={graphData} />
        </div>
      )}
    </div>
  );
};

export default EditableTable;
