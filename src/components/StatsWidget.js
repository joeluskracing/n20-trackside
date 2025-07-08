import React, { useEffect, useState } from 'react';
import { useCar } from '../context/CarContext';
import './StatsWidget.css';

const StatsWidget = () => {
  const { selectedCar } = useCar();
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (selectedCar) {
      window.api.getStatsByYear(selectedCar).then(setStats).catch(err => {
        console.error('Error loading stats:', err);
        setStats({});
      });
    } else {
      setStats({});
    }
  }, [selectedCar]);

  return (
    <div className="grid-box stats-widget">
      <h2>Yearly Stats</h2>
      {Object.keys(stats).length === 0 ? (
        <p>No stats available.</p>
      ) : (
        Object.entries(stats)
          .sort((a, b) => b[0] - a[0])
          .map(([year, s]) => (
            <div key={year} className="year-section">
              <h3>{year}</h3>
              <ul>
                <li>Best Feature Finish: {s.bestFeatureFinish ?? 'N/A'}</li>
                <li>Feature Top 5s: {s.featureTopFives}</li>
                <li>Feature Top 10s: {s.featureTopTens}</li>
                <li>Best Improvement: {s.bestImprovement ?? 'N/A'}</li>
                <li>Average Finish: {s.averageFinish != null ? s.averageFinish.toFixed(2) : 'N/A'}</li>
                <li>Heat Wins: {s.heatWins}</li>
              </ul>
            </div>
          ))
      )}
    </div>
  );
};

export default StatsWidget;
