'use strict';
// Public entry points (ARCHITECTURE §0.2): doGet and tdmsApi are the only globals the platform needs.
// This file only wires real adapters into the pipeline; the logic lives in pipeline.js and the services.
// References to other files are made inside functions only, so file load order does not matter (ARC-10).
const TDMS_BUILD = 'spike-0-005';

function doGet(e) {
  // Spike hook (slice 0-006, removed at 0-010): only ?page=spike opens the spike page; the default is the shell.
  const file = SpikePage.pick(e) === 'spike' ? 'ui/spike/index' : 'ui/shell/index';
  return HtmlService.createTemplateFromFile(file).evaluate()
    .setTitle('TDMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Private (trailing underscore): not callable from the browser. Used by template includes.
function include_(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

// The one server function the browser calls (through api.js only).
function tdmsApi(envelope) {
  return Pipeline.handle(envelope, {
    envelope: Envelope,
    clock: Clock,
    ids: Ids,
    services: { system: SystemService },
    build: TDMS_BUILD,
    minBuild: TDMS_BUILD,
  });
}
