import { useState, useEffect } from "react";
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

  useEffect(() => {
    if (registrationNumber.length === 10 || registrationNumber.length === 12) {
      const batchYear = extractBatchYear(registrationNumber);
      setBatchYear(batchYear);
      localStorage.setItem("registrationNumber", registrationNumber);
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

  const handleSemesterClick = async (sem) => {
    const url = `https://mygvp-server.vercel.app/api/fetch-results`;
    // `${baseUrl}`;
    const payloadData = await getPayload(registrationNumber, sem, urls);
    const payload = {
      url: payloadData[0],
      payload: payloadData[1],
    };
    try {
      const response = await axios.post(url, payload);
      setResultsHtml(response.data);
      localStorage.setItem(
        `results_${registrationNumber}_${sem}`,
        response.data
      );
      const popupWindow = window.open("", "_blank", "width=600,height=600");
      popupWindow.document.write(response.data);
    } catch (error) {
      console.error("Error fetching result data:", error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ position: "relative" }}>
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
        {batchYear && urls[batchYear] && (
          <div className="button-grid">
            {Object.keys(urls[batchYear]).map((sem) => (
              <button key={sem} onClick={() => handleSemesterClick(sem)}>
                {sem}
              </button>
            ))}
          </div>
        )}
      </header>
    </div>
  );
};

export default App;
