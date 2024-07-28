import React from 'react';
import DataGrid from 'react-data-grid';
import './EditableTable.css';

const LockedEditableTable = ({ data, columns, setData, lockedColumns = [] }) => {
  const handleGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    const newRows = data.slice();
    for (let i = fromRow; i <= toRow; i++) {
      newRows[i] = { ...newRows[i], ...updated };
    }
    setData(newRows);
  };

  const gridColumns = columns.map((col) => ({
    key: col,
    name: col,
    editable: !lockedColumns.includes(col),
  }));

  return (
    <DataGrid
      columns={gridColumns}
      rowGetter={(i) => data[i]}
      rowsCount={data.length}
      onGridRowsUpdated={handleGridRowsUpdated}
      enableCellSelect={true}
    />
  );
};

export default LockedEditableTable;
