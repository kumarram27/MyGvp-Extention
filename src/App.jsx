import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { getPayload, extractBatchYear } from "./mygvp";
import Dropdown from "./Dropdown";

const App = () => {
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [batchYear, setBatchYear] = useState(
    localStorage.getItem(`batchYear_${registrationNumber}`) || ""
  );
  const [resultsHtml, setResultsHtml] = useState("");
  const [batchYearOptions, setBatchYearOptions] = useState([]);
  const [hoveredSemester, setHoveredSemester] = useState(null);
  const [urls, setUrls] = useState(localStorage.getItem("urls") ||{});
  const [sgpaInfo, setSgpaInfo] = useState(
    localStorage.getItem(`${registrationNumber}_results`) || {}
  );

  const authorizedRegistrationNumber = import.meta.env
    .VITE_AUTHORIZED_REGISTRATION_NUMBER;
  const hiddenRegistrationNumber = import.meta.env
    .VITE_HIDDEN_REGISTRATION_NUMBER;
  const server = import.meta.env.VITE_SERVER_URL;

  useEffect(() => {
    const fetchUrls = async () => {
      try {
        let storedUrls = localStorage.getItem("urls");

        // Ensure it's a valid JSON string before parsing
        if (storedUrls) {
          storedUrls = JSON.parse(storedUrls);
        } else {
          storedUrls = null;
        }

        console.log("Stored URLs:", storedUrls);

        if (!storedUrls) {
          const response = await axios.get(`${server}/api/getUrls`);
          storedUrls = response.data?.urls || {};

          console.log("Fetched URLs from MongoDB:", storedUrls);

          localStorage.setItem("urls", JSON.stringify(storedUrls));
        }

        setUrls(storedUrls);
      } catch (error) {
        console.error("Error retrieving URLs from MongoDB:", error);
        setUrls({});
      }
    };

    fetchUrls();
  }, [server]);

  useEffect(() => {
    if (
      (registrationNumber.length === 10 || registrationNumber.length === 12) &&
      registrationNumber !== hiddenRegistrationNumber
    ) {
      const extractedBatchYear = extractBatchYear(registrationNumber);
      setBatchYear(extractedBatchYear);
      localStorage.setItem(
        `batchYear_${registrationNumber}`,
        extractedBatchYear
      );

      const availableBatchYears = Object.keys(urls || {}).map((year) => year);
      setBatchYearOptions(availableBatchYears);
    } else if (registrationNumber === authorizedRegistrationNumber) {
      setBatchYear(2021);
    } else {
      setBatchYear(null);
    }
  }, [
    registrationNumber,
    authorizedRegistrationNumber,
    hiddenRegistrationNumber,
    server,
    urls,
  ]);


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

        // Retrieve SGPA data from localStorage
        const sgpaData = JSON.parse(localStorage.getItem(`${upperCaseValue}_results`)) || {};
        setSgpaInfo(sgpaData);

        // If SGPA data is missing, fetch from MongoDB
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
            console.error("Error retrieving GPA data from MongoDB:");
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
      localStorage.removeItem("registrationNumber");
    }
  }, [registrationNumber]);

  const extractName = (html) => {
    const nameRegex = /<th[^>]*>\s*Name\s*<\/th>\s*<td[^>]*>\s*(.*?)\s*<\/td>/i;
    const nameMatch = html.match(nameRegex);

    if (!nameMatch) {
      const nameRegexAlternative =
        /<b>\s*Name\s*<\/b>\s*<\/td>\s*<td[^>]*colspan=['"]?\d+['"]?[^>]*>\s*(.*?)\s*<\/td>/i;
      const nameMatchAlternative = html.match(nameRegexAlternative);
      return nameMatchAlternative ? nameMatchAlternative[1].trim() : null;
    }
    return nameMatch ? nameMatch[1].trim() : null;
  };

  const extractSGPA = (html) => {
    const sgpaRegex = /<th>\s*SGPA\s*<\/th>\s*<th[^>]*>\s*([\d.]+)\s*<\/th>/i;
    const sgpaMatch = html.match(sgpaRegex);

    if (!sgpaMatch) {
      const alternativeRegex =
        /<th>\s*SGPA\s*<\/th>\s*<th[^>]*>\s*([\d.]+)\s*<\/td>/i;
      const sgpaMatchAlt = html.match(alternativeRegex);
      return sgpaMatchAlt ? parseFloat(sgpaMatchAlt[1].trim()) : null;
    }

    return parseFloat(sgpaMatch[1].trim());
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
    const match = data.match(
      /<h2[^>]*>.*?<\/h2>|<table[^>]*>[\s\S]*?<\/table>/gi
    );
    return match ? match.join("\n").trim() : "";
  };



  const handleSemesterClick = useCallback(
    async (sem, batch) => {
      let registrationNum = registrationNumber;
      if(registrationNum === hiddenRegistrationNumber){
        return;
      }
      if (registrationNum === authorizedRegistrationNumber) {
        registrationNum = hiddenRegistrationNumber;
      }
      let batchYear =  batch || localStorage.getItem(`batchYear_${registrationNum}`);
      const storageKey = `results_${registrationNum}_${batchYear}_${sem}`;
      const sgpaKey = `${registrationNum}_results`;
      const Username = `${registrationNum}_name`;
      const storedResult = localStorage.getItem(storageKey) || "";
      let urls = JSON.parse(localStorage.getItem("urls"));

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
      console.log("Fetched payload data:", payloadData);
      const payload = {
        url: payloadData[0],
        payload: payloadData[1],
      };

      try{
        const response = await axios.post(payload.url, payload.payload);
        const cleanedData = cleanResponseData(response.data);
        setResultsHtml(cleanedData);
        showPopup(cleanedData);
        localStorage.setItem(storageKey, cleanedData);
        const name = extractName(cleanedData);
        const sgpa = extractSGPA(cleanedData);
        let sgpaData = JSON.parse(localStorage.getItem(sgpaKey)) || {};
        sgpaData[`${sem}`] = sgpa;
        localStorage.setItem(sgpaKey, JSON.stringify(sgpaData));
        localStorage.setItem(Username, name);
        setSgpaInfo(sgpaData);
        try {
          await axios.post(`${server}/api/save-gpa`, {
            registrationNumber: registrationNum,
            name,
            gpas: sgpaData,
          });
          console.log("GPA data uploaded to MongoDB successfully.");
        } catch (error) {
          console.error("Error uploading GPA data to MongoDB:", error.message);
        }
      } catch (error) {
        console.error("Error fetching result data:", error.message);
      }
    },
    [registrationNumber, server, authorizedRegistrationNumber, hiddenRegistrationNumber]
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