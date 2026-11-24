export const schemaVersion = 1;
export const release = '2.2.0';
export const workflows = ['bootstrap', 'dependency-change'];
export const verificationResults = ['passed', 'failed', 'not_run'];

export function isTelemetryEvent(event) {
  return event !== null && typeof event === 'object' && !Array.isArray(event)
    && Object.keys(event).length === 4
    && event.schema_version === schemaVersion
    && typeof event.release === 'string'
    && /^(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})$/.test(event.release)
    && workflows.includes(event.workflow)
    && verificationResults.includes(event.verification);
}
