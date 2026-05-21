const axios = require("axios");
const fs = require("fs");
const path = require("path");

function loadEnvFile(fileName) {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (!process.env[key]) {
      process.env[key] = rawValue.replace(/^"|"$/g, "");
    }
  }
}

loadEnvFile(".env");
loadEnvFile("config.env");

const PORT = process.env.PORT || 4700;
const URL =
  process.env.RATE_LIMIT_URL || `http://localhost:${PORT}/v1/health-check`;
const REQUEST_COUNT = Number(process.env.RATE_LIMIT_REQUESTS || 80);

async function testRateLimit() {
  console.log(`Sending ${REQUEST_COUNT} requests to ${URL}...`);

  const requests = Array.from({ length: REQUEST_COUNT }).map((_, i) =>
    axios
      .get(URL)
      .then((res) => ({ status: res.status, index: i }))
      .catch((err) => ({
        status: err.response ? err.response.status : "NETWORK_ERROR",
        error: err.response ? err.response.data : err.message,
        index: i,
      })),
  );

  const results = await Promise.all(requests);

  const counts = results.reduce((acc, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  console.log("\nResults:");
  Object.entries(counts).forEach(([status, count]) => {
    console.log(`Status ${status}: ${count} requests`);
  });

  if (counts["429"]) {
    console.log("\nRate limiting is working. Received 429 Too Many Requests.");
  } else {
    console.log("\nRate limiting failed. No 429 status code received.");
    const sampleError = results.find((result) => result.error);
    if (sampleError) {
      console.log("\nSample error:");
      console.log(sampleError.error);
    }
  }
}

testRateLimit();
