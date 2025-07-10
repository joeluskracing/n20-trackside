import React from 'react';
import { useLoading } from '../context/LoadingContext';
import './LoadingOverlay.css';

const flagIcon =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA0MCAzMiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB4PSIyIiB5PSIyIiB3aWR0aD0iMiIgaGVpZ2h0PSIyOCIgZmlsbD0id2hpdGUiIC8+CiAgPGcgZmlsbD0id2hpdGUiPgogICAgPHJlY3QgeD0iNiIgeT0iMiIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPgogICAgPHJlY3QgeD0iMTgiIHk9IjIiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz4KICAgIDxyZWN0IHg9IjEyIiB5PSI4IiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+CiAgICA8cmVjdCB4PSIyNCIgeT0iOCIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPgogICAgPHJlY3QgeD0iNiIgeT0iMTQiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz4KICAgIDxyZWN0IHg9IjE4IiB5PSIxNCIgd2lkdGg9IjYiIGhlaWdodD0iNiIvPgogICAgPHJlY3QgeD0iMTIiIHk9IjIwIiB3aWR0aD0iNiIgaGVpZ2h0PSI2Ii8+CiAgICA8cmVjdCB4PSIyNCIgeT0iMjAiIHdpZHRoPSI2IiBoZWlnaHQ9IjYiLz4KICA8L2c+Cjwvc3ZnPgo=';

const LoadingOverlay = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <img src={flagIcon} alt="loading" className="loading-icon" />
    </div>
  );
};

export default LoadingOverlay;
