import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../context/CarContext';

const CreateCar = () => {
  const [name, setName] = useState('');
  const navigate = useNavigate();
  const { loadCars } = useCar(); // Get loadCars from context

  const handleCreateCar = () => {
    window.api.addCar(name).then(() => {
      loadCars(); // Update the cars list
      navigate('/'); // Navigate back to home after creating the car
    });
  };

  return (
    <div className="create-car">
      <h2>Create Car</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleCreateCar();
        }}
      >
        <label>
          Car Name:
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default CreateCar;
