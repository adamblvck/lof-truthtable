import React from 'react';

const Knob = ({ value, onChange, variable }) => {
  const positions = [0, 1, 2, 3];
  const directions = ['bottom', 'left', 'top', 'right'];

  return (
    <div className="flex flex-col items-center m-2">
      <span className="mb-2">{variable}</span>
      <div className="relative w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700">
        {directions.map((direction, index) => (
          <button
            key={direction}
            className={`absolute w-6 h-6 rounded-full ${
              value === positions[index]
                ? 'bg-blue-500'
                : 'bg-gray-400 dark:bg-gray-600'
            } ${
              direction === 'top' ? 'top-0 left-1/2 transform -translate-x-1/2' :
              direction === 'right' ? 'right-0 top-1/2 transform -translate-y-1/2' :
              direction === 'bottom' ? 'bottom-0 left-1/2 transform -translate-x-1/2' :
              'left-0 top-1/2 transform -translate-y-1/2'
            }`}
            onClick={() => onChange(positions[index])}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full flex items-center justify-center text-lg font-semibold pointer-events-none">
          {value}
        </div>
      </div>
    </div>
  );
};

export default Knob;