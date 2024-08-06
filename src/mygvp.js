// mygvp.js

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
  if (/^20/.test(registrationNumber) && registrationNumber.length === 10)
    return "2020";
  if (/^21/.test(registrationNumber) && registrationNumber.length === 10)
    return "2021";
  if (/^322/.test(registrationNumber) && registrationNumber.length === 12)
    return "2022";
  if (/^323/.test(registrationNumber) && registrationNumber.length === 12)
    return "2023";
  return "2021";
};

const parseResult = (data) => {
  const $ = cheerio.load(data);
  const resultTable = $("table").html();
  return resultTable;
};

const getResults = async (registrationNumber, url) => {
  const parsedUrl = new URL(url);
  const semname = parsedUrl.searchParams.get("semname");
  const regulation = parsedUrl.searchParams.get("regulation");
  const semesterNo = parsedUrl.searchParams.get("semester");

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
    endpoint = "http://gvpce.ac.in:10000/GVP%20Results/RegularResults";
    payload = {
      input1: registrationNumber,
      hidedata: semname,
      hidedata2: regulation,
      hidedata3: semesterNo,
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
    const semname = parsedUrl.searchParams.get("semname");
    const regulation = parsedUrl.searchParams.get("regulation");
    const semesterNo = parsedUrl.searchParams.get("semester");
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
      endpoint = "http://gvpce.ac.in:10000/GVP%20Results/RegularResults";
      payload = {
        input1: registrationNumber,
        hidedata: semname,
        hidedata2: regulation,
        hidedata3: semesterNo,
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