import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { getPayload, extractBatchYear } from "./mygvp";
import urls from "./links";
import Dropdown from "./Dropdown";

const App = () => {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [batchYear, setBatchYear] = useState(
    localStorage.getItem(`batchYear_${registrationNumber}`) || ""
  );
  const [resultsHtml, setResultsHtml] = useState("");
  const [batchYearOptions, setBatchYearOptions] = useState([]);
  const [hoveredSemester, setHoveredSemester] = useState(null);
  const [sgpaInfo, setSgpaInfo] = useState(
    localStorage.getItem(`${registrationNumber}_results`) || {}
  );

  const authorizedRegistrationNumber = import.meta.env.VITE_AUTHORIZED_REGISTRATION_NUMBER;
  const hiddenRegistrationNumber = import.meta.env.VITE_HIDDEN_REGISTRATION_NUMBER;
  const server = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    if (
      (registrationNumber.length === 10 ||
      registrationNumber.length === 12 )&& registrationNumber !== hiddenRegistrationNumber
    ) {
      const extractedBatchYear = extractBatchYear(registrationNumber);
      setBatchYear(extractedBatchYear);
      localStorage.setItem(
        `batchYear_${registrationNumber}`,
        extractedBatchYear
      );
      const availableBatchYears = Object.keys(urls).map((year) => year);
      setBatchYearOptions(availableBatchYears);
    }else if (registrationNumber === authorizedRegistrationNumber) {
      setBatchYear(2021);
    } 
    else {
      setBatchYear(null);
    }
  }, [registrationNumber, authorizedRegistrationNumber, hiddenRegistrationNumber]);

  const handleRegNoChange = useCallback(
    async (event) => {
      const { value } = event.target;
      let upperCaseValue = value.toUpperCase();
      setRegistrationNumber(upperCaseValue);
      setResultsHtml("");
      setBatchYear("");

      if (upperCaseValue === hiddenRegistrationNumber) {
        return;
      }

      if (
        upperCaseValue.length === 10 ||
        upperCaseValue.length === 12 ||
        upperCaseValue === authorizedRegistrationNumber
      ) {
        if (upperCaseValue === authorizedRegistrationNumber) {
          upperCaseValue = hiddenRegistrationNumber;
        }
        const sgpaData =
          JSON.parse(localStorage.getItem(`${upperCaseValue}_results`)) || {};
        setSgpaInfo(sgpaData);
        if (Object.keys(sgpaData).length === 0) {
          try {
            const response = await axios.get(
              `${server}/api/get-gpa/${upperCaseValue}`
            );
            const data = response.data;
            if (data) {
              setSgpaInfo(data.gpas || {});
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
    [server, authorizedRegistrationNumber, hiddenRegistrationNumber]
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
      const user = localStorage.getItem(`${registrationNumber}_name`);
      const storedSgpaData =
        JSON.parse(localStorage.getItem(`${registrationNumber}_results`)) || {};
      console.log("Stored GPA data:", storedSgpaData);

      if (Object.keys(storedSgpaData).length > 0) {
        try {
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
      let registrationNum = registrationNumber;
      if (registrationNum === hiddenRegistrationNumber) {
        console.error("Access denied for this registration number.");
        return;
      }
      if(registrationNum === authorizedRegistrationNumber){
        registrationNum = hiddenRegistrationNumber;
      }
      let batchYear =
        batch || localStorage.getItem(`batchYear_${registrationNum}`);
      const storageKey = `results_${registrationNum}_${batchYear}_${sem}`;
      const sgpaKey = `${registrationNum}_results`;
      const Username = `${registrationNum}_name`;
      const storedResult = localStorage.getItem(storageKey) || "";

      if (storedResult) {
        if (!storedResult.trim()) {
          localStorage.removeItem(storageKey);
        } else {
          setResultsHtml(storedResult);
          showPopup(storedResult);

          const sgpa = extractSGPA(storedResult);
          const name = extractName(storedResult);
          let sgpaData = JSON.parse(localStorage.getItem(sgpaKey)) || {};
          sgpaData[`${sem}`] = sgpa;
          localStorage.setItem(sgpaKey, JSON.stringify(sgpaData));
          setSgpaInfo(sgpaData);
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
        const response = await axios.post(payload.url, payload.payload);
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
        <div className="navbar">
          <div className="logo-title">
            <a href="https://mygvp.github.io/" target="_blank" rel="noreferrer">
              <img
                src="/icons/android-chrome-512x512.png"
                height={27}
                width={27}
                alt="GVP Logo"
                className="logo"
              />
            </a>
            <div className="title">MyGVP</div>
          </div>
          <a
            href="https://github.com/kumarram27/MyGvp-Extention"
            target="_blank"
            rel="noreferrer"
          >
            <img
              src="/icons/git.svg"
              height={27}
              width={27}
              alt="GitHub Logo"
              className="github"
            />
          </a>
        </div>
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
            registrationNumber !== hiddenRegistrationNumber &&
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
          {registrationNumber === hiddenRegistrationNumber && (
            <p style={{ margin: "20px 0", color: "red" }}>Access denied.</p>
          )}
        </header>
      </div>
    </div>
  );
};

export default App;