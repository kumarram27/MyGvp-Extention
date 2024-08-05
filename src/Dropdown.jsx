import React, { useState } from "react";
import "./App.css";

const Dropdown = ({ options, selectedOption, onOptionSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);

  const handleOptionSelect = (option) => {
    onOptionSelect(option);
    setIsOpen(false);
  };

  const sortedOptions = options.slice().sort((a, b) => a - b);

  return (
    <div className="dropdown">
      <button className="dropdown-button" onClick={toggleDropdown}>
        {selectedOption}
      </button>
      {isOpen && (
        <ul className="dropdown-menu">
          {sortedOptions.map((option) => (
            <li
              key={option}
              className="dropdown-item"
              onClick={() => handleOptionSelect(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Dropdown;
