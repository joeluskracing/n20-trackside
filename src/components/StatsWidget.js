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
                <li>
                  <div className="stat-title">Best Feature Finish</div>
                  <div className="stat-number">{s.bestFeatureFinish ?? 'N/A'}</div>
                </li>
                <li>
                  <div className="stat-title">Feature Top 5s</div>
                  <div className="stat-number">{s.featureTopFives}</div>
                </li>
                <li>
                  <div className="stat-title">Feature Top 10s</div>
                  <div className="stat-number">{s.featureTopTens}</div>
                </li>
                <li>
                  <div className="stat-title">Best Improvement</div>
                  <div className="stat-number">{s.bestImprovement ?? 'N/A'}</div>
                </li>
                <li>
                  <div className="stat-title">Average Finish</div>
                  <div className="stat-number">{s.averageFinish != null ? s.averageFinish.toFixed(2) : 'N/A'}</div>
                </li>
                <li>
                  <div className="stat-title">Heat Wins</div>
                  <div className="stat-number">{s.heatWins}</div>
                </li>
              </ul>
            </div>
          ))
      )}
    </div>
  );
};

export default StatsWidget;
