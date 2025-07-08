import React, { useState, useEffect, useRef } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../context/CarContext';

const Home = () => {
  const { cars, selectedCar, setSelectedCar, loadCars } = useCar();
  const [parts, setParts] = useState([]);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    if (selectedCar) {
      window.api.getParts(selectedCar).then((fetchedParts) => {
        setParts(fetchedParts);
      });
    } else {
      setParts([]);
    }
  }, [selectedCar]);

  const handleCarChange = (event) => {
    const carId = event.target.value;
    setSelectedCar(carId);
    localStorage.setItem('selectedCar', carId);
  };

  const handleCreateCar = () => {
    navigate('/create-car'); // Navigate to create car form
  };

  const handleAddPart = async () => {
    const selectedCarObj = cars.find(car => car.id == selectedCar);
    if (selectedCarObj) {
      console.log("Navigating to Add Part with:", { carId: selectedCarObj.id, carName: selectedCarObj.name });
      navigate('/add-part', { state: { carId: selectedCarObj.id, carName: selectedCarObj.name } }); // Navigate to add part form
    } else {
      console.error("Selected car not found in the fetched cars.");
    }
  };

  const handleModifyParts = async () => {
    const selectedCarObj = cars.find(car => car.id == selectedCar);
    if (selectedCarObj) {
      console.log("Navigating to Modify Parts with:", { carId: selectedCarObj.id, carName: selectedCarObj.name });
      navigate('/modify-parts', { state: { carId: selectedCarObj.id, carName: selectedCarObj.name } }); // Navigate to modify parts form
    } else {
      console.error("Selected car not found in the fetched cars.");
    }
  };

  const handleExportCar = async () => {
    if (!selectedCar) return;
    try {
      const filePath = await window.api.exportCarData(selectedCar);
      alert(`Car exported to ${filePath}`);
    } catch (error) {
      console.error('Error exporting car:', error);
    }
  };

  const handleImportButton = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        await window.api.importCarData(file.path);
        loadCars();
        alert('Car imported successfully');
      } catch (error) {
        console.error('Error importing car:', error);
      }
    }
  };

  return (
    <div className="home-grid">
      <div className="grid-box">
        <h2>Currently Selected Car</h2>
        {cars.length === 0 ? (
          <div>
            <p>There are no cars! Create one now.</p>
            <button onClick={handleCreateCar}>Create Car</button>
            <button onClick={handleImportButton}>Import Car</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <div>
            <select value={selectedCar || ''} onChange={handleCarChange}>
              <option value="">Select a car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
            <button onClick={handleCreateCar}>Add another car</button>
            <button onClick={handleExportCar} disabled={!selectedCar}>Export Car</button>
            <button onClick={handleImportButton}>Import Car</button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        )}
      </div>
      <div className="grid-box">
        <h2>Parts List</h2>
        {selectedCar === '' ? (
          <p>Select a car to see parts</p>
        ) : parts.length === 0 ? (
          <div>
            <p>No parts! Add parts now.</p>
            <button onClick={handleAddPart}>Add Part</button>
          </div>
        ) : (
          <div>
            <button onClick={handleAddPart}>Add Part</button>
            <button onClick={handleModifyParts}>Modify Parts</button>
            <ul>
              {parts.map((part) => (
                <li key={part.id}>{part.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
