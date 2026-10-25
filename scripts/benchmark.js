/**
 * ReleaseCheck API Benchmark & Concurrency Stress Test
 * 
 * Usage:
 *   node scripts/benchmark.js [concurrency] [totalRequests] [targetUrl]
 * 
 * Examples:
 *   node scripts/benchmark.js 5 20
 *   node scripts/benchmark.js 10 50
 *   node scripts/benchmark.js 20 100
 */

const TARGET_URL = process.argv[4] || process.env.API_URL || "https://cracto-bk.vercel.app/graphql";
const CONCURRENCY = parseInt(process.argv[2] || "5", 10);
const TOTAL_REQUESTS = parseInt(process.argv[3] || "20", 10);

const GRAPHQL_QUERY = JSON.stringify({
  query: `query BenchmarkReleases {
    releases {
      id
      name
      status
      stepsCompleted
      updatedAt
    }
  }`
});

async function runWorker(workerId, requestQueue, stats) {
  while (requestQueue.length > 0) {
    const reqIndex = requestQueue.pop();
    if (reqIndex === undefined) break;

    const start = performance.now();
    try {
      const res = await fetch(TARGET_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "apollo-require-preflight": "true"
        },
        body: GRAPHQL_QUERY
      });

      const duration = performance.now() - start;
      const status = res.status;
      stats.statusCodes[status] = (stats.statusCodes[status] || 0) + 1;

      if (res.ok) {
        const body = await res.json();
        if (body.errors && body.errors.length > 0) {
          stats.failed++;
          stats.errors.push(body.errors[0].message);
        } else {
          stats.success++;
          stats.latencies.push(duration);
        }
      } else {
        stats.failed++;
      }
    } catch (err) {
      const duration = performance.now() - start;
      stats.latencies.push(duration);
      stats.failed++;
      stats.errors.push(err.message || "Network Error");
    }
  }
}

async function benchmark() {
  console.log("==================================================");
  console.log("🚀 ReleaseCheck API Concurrency & Load Benchmark");
  console.log("==================================================");
  console.log(`Target Endpoint : ${TARGET_URL}`);
  console.log(`Concurrency     : ${CONCURRENCY} workers`);
  console.log(`Total Requests  : ${TOTAL_REQUESTS}`);
  console.log("Running test, please wait...\n");

  const requestQueue = Array.from({ length: TOTAL_REQUESTS }, (_, i) => i);
  const stats = {
    success: 0,
    failed: 0,
    latencies: [],
    statusCodes: {},
    errors: []
  };

  const wallClockStart = performance.now();

  const workers = Array.from({ length: CONCURRENCY }, (_, i) =>
    runWorker(i, requestQueue, stats)
  );

  await Promise.all(workers);

  const totalTimeSeconds = (performance.now() - wallClockStart) / 1000;
  const sortedLatencies = stats.latencies.sort((a, b) => a - b);
  const avgLatency =
    sortedLatencies.reduce((sum, v) => sum + v, 0) / (sortedLatencies.length || 1);
  const p95Index = Math.floor(sortedLatencies.length * 0.95);
  const p95Latency = sortedLatencies[p95Index] || 0;
  const minLatency = sortedLatencies[0] || 0;
  const maxLatency = sortedLatencies[sortedLatencies.length - 1] || 0;
  const throughput = (stats.success + stats.failed) / totalTimeSeconds;

  console.log("----------------- Benchmark Results -----------------");
  console.log(`Total Requests Sent : ${stats.success + stats.failed}`);
  console.log(`Successful (200 OK) : ${stats.success}`);
  console.log(`Failed Responses    : ${stats.failed}`);
  console.log(`HTTP Status Codes   :`, JSON.stringify(stats.statusCodes));
  console.log(`Throughput          : ${throughput.toFixed(2)} req/sec`);
  console.log(`Min Latency         : ${minLatency.toFixed(2)} ms`);
  console.log(`Average Latency     : ${avgLatency.toFixed(2)} ms`);
  console.log(`P95 Latency         : ${p95Latency.toFixed(2)} ms`);
  console.log(`Max Latency         : ${maxLatency.toFixed(2)} ms`);
  console.log(`Total Elapsed Time  : ${totalTimeSeconds.toFixed(2)} s`);
  console.log("-----------------------------------------------------");

  if (stats.failed > 0) {
    console.log(`Sample Failure Reason: ${stats.errors[0] || "HTTP Non-200"}`);
  }
}

benchmark();
