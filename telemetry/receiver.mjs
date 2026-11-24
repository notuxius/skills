import { createServer } from 'node:http';
import * as sqlite from 'node:sqlite';
import { isTelemetryEvent } from './telemetry-schema.mjs';

const Database = sqlite.Database ?? sqlite.DatabaseSync;
const eventPath = '/v1/events';
const maxBytes = 512;
const [command, databasePath, portArgument] = process.argv.slice(2);
const port = portArgument === undefined ? 8787 : Number(portArgument);

if (!databasePath || !['serve', 'report'].includes(command)
  || (command === 'report' && portArgument !== undefined)
  || !Number.isInteger(port) || port < 0 || port > 65535 || process.argv.length > 5) {
  console.error('Usage: receiver.mjs serve <db-path> [port] | report <db-path>');
  process.exit(1);
}

const database = new Database(databasePath, { readOnly: command === 'report', timeout: 1000 });
if (command === 'report') {
  try {
    const counts = database.prepare(`
      SELECT day, schema_version, release, workflow, verification, count
      FROM daily_counts ORDER BY day, schema_version, release, workflow, verification
    `).all();
    console.log(JSON.stringify(counts, null, 2));
  } finally {
    database.close();
  }
} else {
  database.exec(`
    CREATE TABLE IF NOT EXISTS daily_counts (
      day TEXT NOT NULL,
      schema_version INTEGER NOT NULL,
      release TEXT NOT NULL,
      workflow TEXT NOT NULL,
      verification TEXT NOT NULL,
      count INTEGER NOT NULL,
      PRIMARY KEY (day, schema_version, release, workflow, verification)
    ) STRICT
  `);
  const increment = database.prepare(`
    INSERT INTO daily_counts VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT (day, schema_version, release, workflow, verification)
    DO UPDATE SET count = count + 1
  `);
  const server = createServer({ requestTimeout: 5000, headersTimeout: 5000 }, (request, response) => {
    if (request.url !== eventPath) return response.writeHead(404).end();
    if (request.method !== 'POST') return response.writeHead(405, { allow: 'POST' }).end();
    if (request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase() !== 'application/json') {
      return response.writeHead(415).end();
    }
    if (Number(request.headers['content-length']) > maxBytes) {
      return response.writeHead(413, { connection: 'close' }).end();
    }

    const chunks = [];
    let size = 0;
    request.on('data', chunk => {
      if (response.writableEnded) return;
      size += chunk.length;
      if (size > maxBytes) response.writeHead(413, { connection: 'close' }).end();
      else chunks.push(chunk);
    });
    request.on('error', () => response.destroy());
    request.on('end', () => {
      if (response.writableEnded) return;
      let event;
      try {
        event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        return response.writeHead(400).end();
      }
      if (!isTelemetryEvent(event)) return response.writeHead(400).end();

      try {
        const day = new Date().toISOString().slice(0, 10);
        increment.run(day, event.schema_version, event.release, event.workflow, event.verification);
        response.writeHead(204).end();
      } catch {
        response.writeHead(503).end();
      }
    });
  });
  server.once('close', () => database.close());
  server.listen(port, '127.0.0.1', () => {
    console.log(`http://127.0.0.1:${server.address().port}${eventPath}`);
  });
}
