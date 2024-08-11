import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { getPayload, extractBatchYear } from "./mygvp";
import urls from "./links";
import Dropdown from "./Dropdown";

const App = () => {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [batchYear, setBatchYear] = useState("");
  const [resultsHtml, setResultsHtml] = useState("");
  const [batchYearOptions, setBatchYearOptions] = useState([]);
  const [hoveredSemester, setHoveredSemester] = useState(null);
  const [sgpaInfo, setSgpaInfo] = useState(
    localStorage.getItem(`${registrationNumber}_results`) || {}
  );

  const authorizedRegistrationNumber = import.meta.env
    .VITE_AUTHORIZED_REGISTRATION_NUMBER;
  const hiddenRegistrationNumber = (
    import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBER || ""
  ).split(",");
  const server = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const availableBatchYears = Object.keys(urls).map((year) => year);
    setBatchYearOptions(availableBatchYears);

    if (registrationNumber) {
      const storedBatchYear = localStorage.getItem(
        `batchYear_${registrationNumber}`
      );
      const sgpaData =
        JSON.parse(localStorage.getItem(`${registrationNumber}_results`)) || {};
      setSgpaInfo(sgpaData);
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
        let registrationNo = hiddenRegistrationNumber;
        const defaultBatchYear = "2021";
        setBatchYear(defaultBatchYear);
        localStorage.setItem(
          `batchYear_${registrationNo}`,
          defaultBatchYear
        );
      } else {
        setBatchYear(null);
      }
    }
  }, [registrationNumber, hiddenRegistrationNumber,authorizedRegistrationNumber]);

  const handleRegNoChange = useCallback(
    async (event) => {
      const { value } = event.target;
      let upperCaseValue = value.toUpperCase();
      setRegistrationNumber(upperCaseValue);
      setResultsHtml("");
      setBatchYear("");

      if (upperCaseValue === authorizedRegistrationNumber) {
        upperCaseValue = hiddenRegistrationNumber;
      }
      if(upperCaseValue.length === 10 || upperCaseValue.length === 12) {
        const sgpaData =  JSON.parse(localStorage.getItem(`${upperCaseValue}_results`)) || {};
        setSgpaInfo(sgpaData);
        if (Object.keys(sgpaData).length === 0) {
          try {
            const response = await axios.get(
              `${server}/api/get-gpa/${upperCaseValue}`
            );
            const data = response.data;
            if (data) {
              setSgpaInfo(data.gpas || {});
              // Optionally, store this data in local storage
              localStorage.setItem(
                `${upperCaseValue}_results`,
                JSON.stringify(data.gpas || {})
              );
            }
          } catch (error) {
            console.error(
              "Error retrieving GPA data from MongoDB:"
              // , error.message
            );
          }
        }
      }
    },
    [authorizedRegistrationNumber, hiddenRegistrationNumber, server]
  );

  const handleBatchYearChange = useCallback(
    (selectedYear) => {
      setBatchYear(selectedYear);
      localStorage.setItem(`batchYear_${registrationNumber}`, selectedYear);
    },
    [registrationNumber]
  );

  const handleClearRegNo = useCallback(async () => {
    setRegistrationNumber("");
    setBatchYear("");
    setBatchYearOptions([]);
    setSgpaInfo({});
    if (registrationNumber) {
      console.log("Registration number:", registrationNumber);
      const user = localStorage.getItem(`${registrationNumber}_name`);
      // Get stored GPA data
      const storedSgpaData =
        JSON.parse(localStorage.getItem(`${registrationNumber}_results`)) || {};
      console.log("Stored GPA data:", storedSgpaData);

      if (Object.keys(storedSgpaData).length > 0) {
        try {
          if (user !== null) {
            await axios.post(`${server}/api/save-gpa`, {
              registrationNumber,
              name: user,
              gpas: storedSgpaData,
            });
            console.log("GPA data sent to MongoDB");
          } else {
            await axios.post(`${server}/api/save-gpa`, {
              registrationNumber,
              gpas: storedSgpaData,
            });
            console.log("GPA data sent to MongoDB");
          }
          await axios.post(`${server}/api/save-gpa`, {
            registrationNumber,
            name: user,
            gpas: storedSgpaData,
          });
          console.log("GPA data sent to MongoDB");
        } catch (error) {
          console.error("Error saving GPA data to MongoDB:", error.message);
        }
      }
      localStorage.removeItem("registrationNumber");
    }
  }, [registrationNumber, server]);

  const extractName = (html) => {
    const nameRegex =/<th align='left'>Name<\/th><td colspan='3'>(.*?)<\/td>/;
    const nameMatch = html.match(nameRegex);
    if (!nameMatch) {
      const nameRegexAlternative =
        /<b>Name<\/b><\/td><td colspan="4">(.*?)<\/td>/;
      const nameMatchAlternative = html.match(nameRegexAlternative);
      return nameMatchAlternative ? nameMatchAlternative[1] : null;
    }
    return nameMatch ? nameMatch[1] : null;
  };
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
        registrationNum = hiddenRegistrationNumber;
      }

      let batchYear =
        batch || localStorage.getItem(`batchYear_${registrationNum}`);
      const storageKey = `results_${registrationNum}_${batchYear}_${sem}`;
      const sgpaKey = `${registrationNum}_results`;
      const Username = `${registrationNum}_name`;
      const storedResult = localStorage.getItem(storageKey);

      if (storedResult) {
        if (!storedResult.trim()) {
          localStorage.removeItem(storageKey);
        } else {
          setResultsHtml(storedResult);
          showPopup(storedResult);

          // Update SGPA info
          const sgpa = extractSGPA(storedResult);
          const name = extractName(storedResult);
          let sgpaData = JSON.parse(localStorage.getItem(sgpaKey)) || {};
          sgpaData[`${sem}`] = sgpa;
          localStorage.setItem(sgpaKey, JSON.stringify(sgpaData));
          setSgpaInfo(sgpaData); // Update SGPA info for the current registration number
          localStorage.setItem(Username, name);
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
          const name = extractName(cleanedData);
          const sgpa = extractSGPA(cleanedData);
          let sgpaData = JSON.parse(localStorage.getItem(sgpaKey)) || {};
          sgpaData[`${sem}`] = sgpa;
          localStorage.setItem(sgpaKey, JSON.stringify(sgpaData));
          localStorage.setItem(Username, name);

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
    [registrationNumber, hiddenRegistrationNumber ,authorizedRegistrationNumber]
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
              hiddenRegistrationNumber &&
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
          {registrationNumber ===
            hiddenRegistrationNumber && (
            <p style={{ margin: "20px 0", color: "red" }}>Access denied.</p>
          )}
        </header>
      </div>
    </div>
  );
};

export default App;