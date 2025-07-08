import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCar } from '../context/CarContext';

const CreateCar = () => {
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [templates, setTemplates] = useState([]);
  const navigate = useNavigate();
  const { loadCars } = useCar(); // Get loadCars from context

  useEffect(() => {
    const fetchTemplates = async () => {
      const t = await window.api.getCarTemplates();
      setTemplates(t);
    };
    fetchTemplates();
  }, []);

  const handleCreateCar = () => {
    window.api.addCar(name).then(async (car) => {
      if (templateId) {
        await window.api.applyTemplateToCar(templateId, car.id);
      }
      loadCars();
      navigate('/');
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
        <label>
          Template:
          <select value={templateId} onChange={e => setTemplateId(e.target.value)}>
            <option value="">None</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>
        <button type="submit">Create</button>
      </form>
    </div>
  );
};

export default CreateCar;
