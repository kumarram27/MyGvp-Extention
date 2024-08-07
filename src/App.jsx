import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { getPayload, extractBatchYear } from "./mygvp";
import urls from "./links";
import Dropdown from "./Dropdown";

const App = () => {
  const [registrationNumber, setRegistrationNumber] = useState(
    localStorage.getItem("registrationNumber") || ""
  );
  const [batchYear, setBatchYear] = useState("");
  const [resultsHtml, setResultsHtml] = useState("");
  const [batchYearOptions, setBatchYearOptions] = useState([]);
  const [hoveredSemester, setHoveredSemester] = useState(null);
  const [sgpaInfo, setSgpaInfo] = useState({});

  const authorizedRegistrationNumber = import.meta.env
    .VITE_AUTHORIZED_REGISTRATION_NUMBER;
  const hiddenRegistrationNumbers = (
    import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBERS || ""
  ).split(",");

  useEffect(() => {
    const availableBatchYears = Object.keys(urls).map((year) => year);
    setBatchYearOptions(availableBatchYears);

    if (registrationNumber) {
      const storedBatchYear = localStorage.getItem(
        `batchYear_${registrationNumber}`
      );

      if (storedBatchYear) {
        setBatchYear(storedBatchYear);
      } else if (
        registrationNumber.length === 10 ||
        registrationNumber.length === 12
      ) {
        const extractedBatchYear = extractBatchYear(registrationNumber);
        setBatchYear(extractedBatchYear);
        localStorage.setItem(
          `batchYear_${registrationNumber}`,
          extractedBatchYear
        );
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

      localStorage.setItem("registrationNumber", registrationNumber);
    }
  }, [registrationNumber, authorizedRegistrationNumber]);

  
  const handleRegNoChange = useCallback((event) => {
    const { value } = event.target;
    let upperCaseValue = value.toUpperCase();
    setRegistrationNumber(upperCaseValue);

    // Clear results and batch year
    setResultsHtml("");
    setBatchYear("");

    if (upperCaseValue === authorizedRegistrationNumber) {
      upperCaseValue = import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBERS;
    }
    const sgpaData =
      JSON.parse(localStorage.getItem(`${upperCaseValue}_results`)) || {};
    setSgpaInfo(sgpaData);
  }, []);



  const handleBatchYearChange = useCallback(
    (selectedYear) => {
      setBatchYear(selectedYear);
      localStorage.setItem(`batchYear_${registrationNumber}`, selectedYear);
    },
    [registrationNumber]
  );

  const handleClearRegNo = useCallback(() => {
    setRegistrationNumber("");
    setBatchYear("");
    setBatchYearOptions([]);
    setSgpaInfo({});
    localStorage.removeItem("registrationNumber");
    
  }, []);

  const extractSGPA = (html) => {
    const sgpaRegex =
      /<th align='left'>SGPA<\/th><td colspan='3' align='center'>\s*([\d.]+)\s*<\/td>/;
    const sgpaMatch = html.match(sgpaRegex);

    if (!sgpaMatch) {
      const sgpaRegexAlternative =
        /<b>SGPA<\/b><\/td><td colspan=4><p style='text-align:center;'>([\d.]+)<\/p><\/td>/;
      const sgpaMatchAlternative = html.match(sgpaRegexAlternative);
      if (sgpaMatchAlternative) {
        return parseFloat(sgpaMatchAlternative[1]);
      }
      return null;
    }

    return parseFloat(sgpaMatch[1]);
  };

  const showPopup = (storedResult) => {
    const popupWindow = window.open("", "_blank", "width=1100,height=650");
    if (popupWindow) {
      popupWindow.document.open();
      popupWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Results</title>
          <link rel="icon" type="image/png" href="/icons/gvp.png">
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: center; border: 1px solid #ddd; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          ${storedResult}
        </body>
      </html>
    `);
      popupWindow.document.close();
    } else {
      console.error("Failed to open popup window.");
    }
  };

  const cleanResponseData = (data) => {
    const cleanedData = data.split("\n").slice(1, -2).join("\n");
    const lines = cleanedData.split("\n");
    if (lines.length > 1) {
      lines.splice(-2, 1);
    }
    return lines.join("\n");
  };

  const handleSemesterClick = useCallback(
    async (sem, batch) => {
      const url = import.meta.env.VITE_API;
      let registrationNum = registrationNumber;

      // Handle authorization and hidden registration numbers
      if (registrationNumber === authorizedRegistrationNumber) {
        registrationNum = import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBERS;
      }

      let batchYear =
        batch || localStorage.getItem(`batchYear_${registrationNum}`);
      const storageKey = `results_${registrationNum}_${batchYear}_${sem}`;
      const sgpaKey = `${registrationNum}_results`;
      const storedResult = localStorage.getItem(storageKey);

      if (storedResult) {
        if (!storedResult.trim()) {
          localStorage.removeItem(storageKey);
        } else {
          setResultsHtml(storedResult);
          showPopup(storedResult);

          // Update SGPA info
          const sgpa = extractSGPA(storedResult);
          let sgpaData = JSON.parse(localStorage.getItem(sgpaKey)) || {};
          sgpaData[`${sem}`] = sgpa;
          localStorage.setItem(sgpaKey, JSON.stringify(sgpaData));
          setSgpaInfo(sgpaData); // Update SGPA info for the current registration number
          return;
        }
      }

      const payloadData = await getPayload(
        registrationNum,
        batchYear,
        sem,
        urls
      );
      if (!payloadData) {
        console.error("Invalid payload data.");
        return;
      }

      const payload = {
        url: payloadData[0],
        payload: payloadData[1],
      };

      try {
        const response = await axios.post(url, payload);
        const cleanedData = cleanResponseData(response.data);

        if (cleanedData.trim()) {
          setResultsHtml(cleanedData);
          localStorage.setItem(storageKey, cleanedData);

          const sgpa = extractSGPA(cleanedData);
          let sgpaData = JSON.parse(localStorage.getItem(sgpaKey)) || {};
          sgpaData[`${sem}`] = sgpa;
          localStorage.setItem(sgpaKey, JSON.stringify(sgpaData));

          // Update SGPA info
          setSgpaInfo(sgpaData);
          showPopup(cleanedData);
        } else {
          console.warn("Received empty result data.");
        }
      } catch (error) {
        console.error("Error fetching result data:", error.message);
      }
    },
    [registrationNumber, authorizedRegistrationNumber]
  );


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
                    onClick={() => handleSemesterClick(sem, batchYear)}
                    onMouseEnter={() => setHoveredSemester(sem)}
                    onMouseLeave={() => setHoveredSemester(null)}
                    className={hoveredSemester === sem ? "hovered" : ""}
                  >
                    {hoveredSemester === sem
                      ? sgpaInfo[`${sem}`]
                        ? `SGPA: ${sgpaInfo[`${sem}`].toFixed(2)}`
                        : sem
                      : sem}
                  </button>
                  
                ))}
              </div>
            )}
        </header>
      </div>
    </div>
  );
};

export default App;