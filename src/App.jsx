import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { getPayload, extractBatchYear } from "./mygvp";
import urls from "./links";
import Dropdown from "./Dropdown";

const App = () => {
  const [registrationNumber, setRegistrationNumber] = useState(
    localStorage.getItem("registrationNumber") || ""
  );
  const [batchYear, setBatchYear] = useState(
    localStorage.getItem(`batchYear_${registrationNumber}`) || ""
  );
  const [resultsHtml, setResultsHtml] = useState("");
  const [batchYearOptions, setBatchYearOptions] = useState([]);

  const authorizedRegistrationNumber = import.meta.env
    .VITE_AUTHORIZED_REGISTRATION_NUMBER;
  const hiddenRegistrationNumbers = (
    import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBERS || ""
  ).split(",");

  useEffect(() => {
    // Update the local storage and state based on the registration number
    if (registrationNumber.length === 10 || registrationNumber.length === 12) {
      const extractedBatchYear = extractBatchYear(registrationNumber);
      if (extractedBatchYear) {
        setBatchYear(extractedBatchYear);
        localStorage.setItem(
          `batchYear_${registrationNumber}`,
          extractedBatchYear
        );
      } else {
        const defaultBatchYear = "2021";
        setBatchYear(defaultBatchYear);
      }
    } else if (registrationNumber === authorizedRegistrationNumber) {
      const defaultBatchYear = "2021";
      setBatchYear(defaultBatchYear);
      localStorage.setItem(
        `batchYear_${registrationNumber}`,
        defaultBatchYear
      );
    } else {
      setBatchYear(null);
    }

    const availableBatchYears = Object.keys(urls).map((year) =>
      year
    );
    setBatchYearOptions(availableBatchYears);

    // Store registration number in local storage
    localStorage.setItem("registrationNumber", registrationNumber);
  }, [registrationNumber, authorizedRegistrationNumber]);

  const handleRegNoChange = (event) => {
    const { value } = event.target;
    setRegistrationNumber(value.toUpperCase());
  };

  const handleBatchYearChange = (selectedYear) => {
    setBatchYear(selectedYear);
    localStorage.setItem(`batchYear_${registrationNumber}`, selectedYear);
  };

  const handleClearRegNo = () => {
    setRegistrationNumber("");
    setBatchYear("");
    setBatchYearOptions([]);
    localStorage.removeItem("registrationNumber");
  };

  const cleanResponseData = (data) => {
    const cleanedData = data.split("\n").slice(1, -2).join("\n");
    const lines = cleanedData.split("\n");
    if (lines.length > 1) {
      lines.splice(-2, 1); // Remove the last second line
    }
    return lines.join("\n");
  };

  const handleSemesterClick = async (sem) => {
    const url = import.meta.env.VITE_API;
    let registrationNum = registrationNumber;
    if (registrationNumber === authorizedRegistrationNumber) {
      registrationNum = import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBERS;
    }
    const storedResult = localStorage.getItem(
      `results_${registrationNum}_${sem}`
    );
    if (storedResult) {
      setResultsHtml(storedResult);
      const popupWindow = window.open("", "_blank", "width=1100,height=650");
      popupWindow.document.write(`
        <html>
          <head>
            <title>Results</title>
            <link rel="icon" type="image/png" href="/icons/gvp.png">
          </head>
          <body>
            ${storedResult}
          </body>
        </html>
      `);
      return;
    }

    const payloadData = await getPayload(registrationNum, sem, urls);
    const payload = {
      url: payloadData[0],
      payload: payloadData[1],
    };

    try {
      const response = await axios.post(url, payload);
      const cleanedData = cleanResponseData(response.data);
      setResultsHtml(cleanedData);
      localStorage.setItem(`results_${registrationNum}_${sem}`, cleanedData);
      const popupWindow = window.open("", "_blank", "width=1100,height=650");
      popupWindow.document.write(`
        <html>
          <head>
            <title>Results</title>
            <link rel="icon" type="image/png" href="/icons/gvp.png">
          </head>
          <body>
            ${cleanedData}
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error fetching result data:", error.message);
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="App-header">
          <div className="reg-input-container">
            <input
              type="text"
              className="reg-input"
              value={registrationNumber}
              onChange={handleRegNoChange}
              placeholder="Enter Registration Number"
            />
            {registrationNumber && (
              <button className="clear-button" onClick={handleClearRegNo}>
                &#x2715;
              </button>
            )}
            {batchYearOptions.length > 0 && (
              <Dropdown
                options={batchYearOptions}
                selectedOption={batchYear}
                onOptionSelect={handleBatchYearChange}
              />
            )}
          </div>
          {batchYear &&
            registrationNumber !==
              import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBERS &&
            urls[batchYear] && (
              <div className="button-grid">
                {Object.keys(urls[batchYear]).map((sem) => (
                  <button
                    type="button"
                    key={sem}
                    onClick={() => handleSemesterClick(sem)}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            )}
          {registrationNumber ===
            import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBERS && (
            <p style={{ margin: "20px 0", color: "red" }}>Access denied.</p>
          )}
        </header>
      </div>
    </div>
  );
};

export default App;
