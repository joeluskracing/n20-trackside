import React, { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../context/CarContext';

const Home = () => {
  const { cars, selectedCar, setSelectedCar, loadCars } = useCar();
  const [parts, setParts] = useState([]);
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

  return (
    <div className="home-grid">
      <div className="grid-box">
        <h2>Currently Selected Car</h2>
        {cars.length === 0 ? (
          <div>
            <p>There are no cars! Create one now.</p>
            <button onClick={handleCreateCar}>Create Car</button>
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
