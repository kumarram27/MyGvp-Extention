import axios from "axios";
import cheerio from "cheerio";

const fetchResultData = async (url, payload) => {
  try {
    const response = await axios.post(url, payload);
    return response.data;
  } catch (error) {
    console.error("Error fetching result data:", error);
    throw new Error("Error fetching result data:", error.message);
  }
};

const extractBatchYear = (registrationNumber) => {
  if (registrationNumber.includes("A")) return "2021";

  const match = registrationNumber.match(/^.(\d{2})/);
  if (match) return `20${match[1]}`;

  return "2021";
};


const parseResult = (data) => {
  const $ = cheerio.load(data);
  const resultTable = $("table").html();
  return resultTable;
};

const getResults = async (registrationNumber, url) => {
  const parsedUrl = new URL(url);
  const fileName = parsedUrl.searchParams.get("fileName");
  const regulation = parsedUrl.searchParams.get("regulation");
  const semester = parsedUrl.searchParams.get("semester");
  const revaluationDate = parsedUrl.searchParams.get("revaluationDate");
  const type = parsedUrl.searchParams.get("type");

  const constructEndpoint = (url) => {
    return url.replace("btechsearch.asp", "find_info.asp");
  };

  let endpoint;
  let payload;

  if (url.includes("btechsearch.asp")) {
    endpoint = constructEndpoint(url);
    payload = {
      u_input: registrationNumber,
      u_field: "state",
    };
  } else {
    endpoint = "http://gvpce.ac.in:10000/GVP%20Results/gvpResults";
    payload = {
      number: registrationNumber,
      filename: fileName,
      regulation: regulation,
      semester: semester,
      revaluationdate: revaluationDate,
      type: type,
    };
  }
  const payloadString = new URLSearchParams(payload).toString();

  try {
    const resultData = await fetchResultData(endpoint, payloadString);
    const result = parseResult(resultData);
    return result;
  } catch (error) {
    console.error("Error fetching or displaying results:", error);
    return null;
  }
};


const getPayload = async (registrationNumber,batchYear, semester, urls) => {
  const url = urls[batchYear] && urls[batchYear][semester];
  if (url) {
    const parsedUrl = new URL(url);
    const fileName = parsedUrl.searchParams.get("fileName");
    const regulation = parsedUrl.searchParams.get("regulation");
    const semester = parsedUrl.searchParams.get("semester");
    const revaluationDate = parsedUrl.searchParams.get("revaluationDate");
    const type = parsedUrl.searchParams.get("type");
    const constructEndpoint = (url) => {
      return url.replace("btechsearch.asp", "find_info.asp");
    };
    let endpoint;
    let payload;
    if (url.includes("btechsearch.asp")) {
      endpoint = constructEndpoint(url);
      payload = {
        u_input: registrationNumber,
        u_field: "state",
      };
    } else {
      endpoint = "http://gvpce.ac.in:10000/GVP%20Results/gvpResults";
      payload = {
        number: registrationNumber,
        fileName: fileName,
        regulation: regulation,
        semester: semester,
        revaluationDate: revaluationDate,
        type: type,
      };
    }
    const payloadString = new URLSearchParams(payload).toString();
    try {
      const result = [endpoint, payloadString];
      return result;
    } catch (error) {
      console.error("Error fetching or displaying results:", error);
      return null;
    }
  }
  return null;
};

export { extractBatchYear, getResults, getPayload };