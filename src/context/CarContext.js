import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLoading } from './LoadingContext';

const CarContext = createContext();

export const useCar = () => {
  return useContext(CarContext);
};

export const CarProvider = ({ children }) => {
  const [cars, setCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState(localStorage.getItem('selectedCar') || '');
  const { showLoading, hideLoading } = useLoading();

  useEffect(() => {
    loadCars();
  }, []);

  useEffect(() => {
    if (selectedCar) {
      localStorage.setItem('selectedCar', selectedCar);
    }
  }, [selectedCar]);

  const loadCars = async () => {
    showLoading();
    try {
      const fetchedCars = await window.api.getCars();
      setCars(fetchedCars);

      if (!selectedCar && fetchedCars.length > 0) {
        setSelectedCar(fetchedCars[0].id);
        localStorage.setItem('selectedCar', fetchedCars[0].id);
      }
    } finally {
      hideLoading();
    }
  };

  return (
    <CarContext.Provider value={{ cars, setCars, selectedCar, setSelectedCar, loadCars }}>
      {children}
    </CarContext.Provider>
  );
};
