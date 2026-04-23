"use strict";

/* Deploy (from this directory, after npm install):
   gcloud config set project weddinginv-494020
   gcloud functions deploy rsvpInsert --gen2 --runtime=nodejs22 --region=YOUR_REGION \
     --source=. --entry-point=rsvpInsert --trigger-http --allow-unauthenticated \
     --set-env-vars "GCP_PROJECT=weddinginv-494020,BQ_DATASET=guests,BQ_TABLE=guests,RSVP_SECRET=YOUR_LONG_SECRET"
   Grant the function's service account roles/bigquery.dataEditor on dataset guests. */

const { BigQuery } = require("@google-cloud/bigquery");
const functions = require("@google-cloud/functions-framework");

const PROJECT_ID = process.env.GCP_PROJECT || "weddinginv-494020";
const DATASET = process.env.BQ_DATASET || "guests";
const TABLE = process.env.BQ_TABLE || "guests";
const RSVP_SECRET = process.env.RSVP_SECRET || "";

functions.http("rsvpInsert", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "method_not_allowed" });
    return;
  }

  if (!RSVP_SECRET) {
    res.status(500).json({ error: "server_misconfigured" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
  }
  if (
    (body == null || typeof body !== "object") &&
    req.rawBody &&
    Buffer.isBuffer(req.rawBody)
  ) {
    try {
      body = JSON.parse(req.rawBody.toString("utf8"));
    } catch {
      res.status(400).json({ error: "invalid_json" });
      return;
    }
  }

  if (body == null || typeof body !== "object") {
    res.status(400).json({ error: "invalid_body" });
    return;
  }

  if (body.secret !== RSVP_SECRET) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const row = {
    name_surname: String(body.name_surname ?? "").trim(),
    yes_no: String(body.yes_no ?? "").trim(),
    guest_number: String(body.guest_number ?? "").trim(),
    comment: String(body.comment ?? "").trim(),
  };

  try {
    const bq = new BigQuery({ projectId: PROJECT_ID });
    const table = bq.dataset(DATASET).table(TABLE);
    await table.insert([row]);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "insert_failed" });
  }
});
