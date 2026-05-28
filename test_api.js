async function checkApi() {
  try {
    console.log("Fetching doctors API...");
    const res = await fetch('http://localhost:3001/api/v1/doctor/fetchAll');
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response JSON:", JSON.stringify(json, null, 2));
  } catch (err) {
    console.error("API Fetch Error:", err);
  }
}

checkApi();
