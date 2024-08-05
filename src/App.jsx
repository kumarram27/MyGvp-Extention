import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import { getPayload, extractBatchYear } from "./mygvp";
import urls from "./links";

const App = () => {
  const [registrationNumber, setRegistrationNumber] = useState(
    localStorage.getItem("registrationNumber") || ""
  );
  const [batchYear, setBatchYear] = useState(
    extractBatchYear(registrationNumber)
  );
  const [resultsHtml, setResultsHtml] = useState("");
  

  const authorizedRegistrationNumber = "KUMAR";

  useEffect(() => {
    if (registrationNumber.length === 10 || registrationNumber.length === 12) {
      const batchYear = extractBatchYear(registrationNumber);
      setBatchYear(batchYear);
      localStorage.setItem("registrationNumber", registrationNumber);
    } else if (registrationNumber === authorizedRegistrationNumber) {
      setBatchYear("2021");
      localStorage.setItem("registrationNumber", registrationNumber);
    } else {
      setBatchYear(null); // Reset batchYear when registrationNumber doesn't match any condition
    }
  }, [registrationNumber]);

  const handleRegNoChange = (event) => {
    const { value } = event.target;
    setRegistrationNumber(value.toUpperCase()); // Convert to uppercase
  };

  const handleClearRegNo = () => {
    setRegistrationNumber("");
    setBatchYear("");
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
    const url = `https://mygvp-server.vercel.app/api/fetch-results`;
    let registrationNum = registrationNumber;
    if (registrationNumber === authorizedRegistrationNumber) {
      registrationNum = "21131A0527";
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
          </div>
          {batchYear !== null &&
            registrationNumber !== "21131A0527" &&
            batchYear &&
            urls[batchYear] && (
              <div className="button-grid">
                {Object.keys(urls[batchYear]).map((sem) => (
                  <button type="text" key={sem} onClick={() => handleSemesterClick(sem)}>
                    {sem}
                  </button>
                ))}
              </div>
            )}
          {registrationNumber === "21131A0527" && (
            <p style={{ margin: "20px 0", color: "red" }}>Access denied.</p>
          )}
        </header>
      </div>
    </div>
  );
};

export default App;
