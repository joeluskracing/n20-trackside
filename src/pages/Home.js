import React, { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(localStorage.getItem('selectedCar') || '');
  const [defaultCar, setDefaultCar] = useState(localStorage.getItem('defaultCar') || '');
  const [parts, setParts] = useState([]);
  const [showMessage, setShowMessage] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch cars from the database
    window.api.getCars().then((fetchedCars) => {
      setCars(fetchedCars);
    });
  }, []);

  useEffect(() => {
    if (selectedCar) {
      // Fetch parts for the selected car
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
    const fetchedCars = await window.api.getCars(); // Ensure latest data
    const selectedCarObj = fetchedCars.find(car => car.id == selectedCar);
    if (selectedCarObj) {
      console.log("Navigating to Add Part with:", { carId: selectedCarObj.id, carName: selectedCarObj.name });
      navigate('/add-part', { state: { carId: selectedCarObj.id, carName: selectedCarObj.name } }); // Navigate to add part form
    } else {
      console.error("Selected car not found in the fetched cars.");
    }
  };

  const handleModifyParts = async () => {
    const fetchedCars = await window.api.getCars(); // Ensure latest data
    const selectedCarObj = fetchedCars.find(car => car.id == selectedCar);
    if (selectedCarObj) {
      console.log("Navigating to Modify Parts with:", { carId: selectedCarObj.id, carName: selectedCarObj.name });
      navigate('/modify-parts', { state: { carId: selectedCarObj.id, carName: selectedCarObj.name } }); // Navigate to modify parts form
    } else {
      console.error("Selected car not found in the fetched cars.");
    }
  };

  const handleMakeDefault = () => {
    setDefaultCar(selectedCar);
    localStorage.setItem('defaultCar', selectedCar);
    setShowMessage(true);
    setTimeout(() => {
      setShowMessage(false);
    }, 3000);
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
            <select value={selectedCar} onChange={handleCarChange}>
              <option value="">Select a car</option>
              {cars.map((car) => (
                <option key={car.id} value={car.id}>
                  {car.name}
                </option>
              ))}
            </select>
            {selectedCar && selectedCar !== defaultCar && (
              <button className="make-default-button" onClick={handleMakeDefault}>
                Make Default
              </button>
            )}
            {showMessage && <p className="default-message">Current car is set as default</p>}
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
      {/* Add more grid boxes as needed */}
    </div>
  );
};

export default Home;
