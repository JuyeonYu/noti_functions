/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onRequest} from "firebase-functions/https";
import * as logger from "firebase-functions/logger";
import type { Request as ExpressRequest, Response as ExpressResponse } from "express";

setGlobalOptions({ maxInstances: 10 });

export const helloWorld = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const helloWorld2 = onRequest((request, response) => {
  logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase2!");
});

type CurrencyQuery = {
  from?: string;
  to?: string;
};

export const getCurrency = onRequest(
  async (req: ExpressRequest<{}, {}, {}, CurrencyQuery>, res: ExpressResponse) => {
    const { from, to } = req.query;

    if (!from || !to) {
      res.status(400).send("missing params");
      return;
    }

    // 여기부터 from, to는 string

    const url = buildNaverCurrencyUrl(from, to);
    logger.info(`calling naver: ${url}`);

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "*/*",
      },
    });
    const text = await upstream.text();

    if (!upstream.ok) {
      logger.error("Naver upstream error", {
        status: upstream.status,
        bodyPreview: text.slice(0, 300),
      });
      res.status(502).json({
        error: "upstream error",
        status: upstream.status,
        bodyPreview: text.slice(0, 300),
      });
      return;
    }

    res.set("Cache-Control", "no-store");

    let payload: any;
    try {
      payload = JSON.parse(text);
    } catch {
      res.status(502).json({ error: "invalid_upstream_payload", bodyPreview: text.slice(0, 300) });
      return;
    }

    const country = Array.isArray(payload?.country) ? payload.country : null;
    if(!country || country.length < 2) {
      res.status(502).json({ error: "missing_country, ", payload });
      return;
    }

    const rawFrom = String(country[0]?.value ?? "");
    const rawTo = String(country[1]?.value ?? "");
    logger.info(`value: ${rawFrom}, ${rawTo}`);

    res.status(200).json({
      country
    });
  }
);

function buildNaverCurrencyUrl(from: string, to: string): string {
  return `https://m.search.naver.com/p/csearch/content/qapirender.nhn?key=calculator&pkid=141&q=%ED%99%98%EC%9C%A8&where=m&u1=keb&u6=standardUnit&u7=0&u3=${to}&u4=${from}&u8=down&u2=1`
}