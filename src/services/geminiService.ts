import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

export function getAI(overrideKey?: string): GoogleGenAI {
  const key = overrideKey || process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY environment variable or override is required");
  }
  
  // Re-initialize if the key changed (e.g., user updated the input)
  if (!ai || (ai as any).apiKey !== key) {
    ai = new GoogleGenAI({ apiKey: key });
  }
  return ai;
}

const COMMON_CONFIG = {
  model: "gemini-3.1-pro-preview",
  tools: [{ googleSearch: {} }],
};

async function executeWithRetry<T>(operation: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxRetries) {
        throw error;
      }
      const waitTime = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Gemini API call failed. Retrying in ${waitTime}ms... (Attempt ${attempt} of ${maxRetries})`, error?.message);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  throw new Error("Execute with retry failed");
}

export async function generate7AMBriefing(apiKeyOverride?: string) {
  const prompt = `
  You are an expert financial market analyst. Provide a small, concise briefing on the market update and status for Gold (XAUUSD) and the US Dollar Index (DXY).
  Focus ONLY on what happened within the LAST 24 HOURS.
  Requirements:
  - IMPORTANT: You MUST use the Google Search tool to fetch the absolute latest, current LIVE real-time prices for Gold (XAUUSD) and the US Dollar Index (DXY) right now, and include these live prices in the briefing. Base your analysis on this fresh live data.
  - Structured and easy to navigate.
  - Eye-catching with appropriate emojis.
  - Formatted beautifully for Telegram using pure text and emojis. DO NOT use Markdown asterisks or underscores.
  - Include current status/price levels broadly and major overnight moves.
  `;
  const response = await executeWithRetry(() => getAI(apiKeyOverride).models.generateContent({
    ...COMMON_CONFIG,
    contents: prompt,
  }));
  return response.text;
}

export async function generate730AMCalendar(apiKeyOverride?: string) {
  const prompt = `
  You are an expert financial market analyst. Compile the latest daily economic calendar specifically covering DXY, EURUSD, GBPUSD, and USDJPY.
  You MUST source today's high-impact and medium-impact news list as they would appear on Forex Factory.
  Requirements:
  - IMPORTANT: You MUST use the Google Search tool to fetch the LIVE, real-time up-to-date economic calendar data for today. Do not guess; find the actual releases scheduled for today.
  - Display the time of release, currency affected, and the event name.
  - Highlight the anticipated impact (e.g., High 🔴, Medium 🟠).
  - Structured, easy to navigate, and eye-catching with emojis.
  - Formatted beautifully for Telegram.
  `;
  const response = await executeWithRetry(() => getAI(apiKeyOverride).models.generateContent({
    ...COMMON_CONFIG,
    contents: prompt,
  }));
  return response.text;
}

export async function generate8AMDeepOverview(apiKeyOverride?: string) {
  const prompt = `
  You are an expert financial market analyst. Provide a VERY DEEP OVERVIEW of the latest market updates covering major articles, news, and updates.
  You MUST provide a deep sentiment and fundamental view on what can affect Gold (XAUUSD) today.
  Cover macroeconomic factors heavily: wars, geopolitical tension, rate cuts, NFP, CPI, or other major US news releases.
  
  Requirements:
  - IMPORTANT: You MUST use the Google Search tool to fetch the absolute latest news articles, macroeconomic updates, and LIVE Gold/DXY real-time prices from the last few hours to power your deep analysis.
  - NEW REQUIREMENT (Sentiment Analysis): Process current news headlines and article content related to gold and DXY. Classify the overall sentiment as positive, negative, or neutral, and provide a quantifiable measure (e.g., 75% Bullish, 25% Bearish based on 10 recent headlines).
  - NEW REQUIREMENT (Historical Context): Analyze historical price data for gold and DXY over the past month. Identify significant price swings and correlate them with major economic news releases or geopolitical events from that period. Present these findings to offer a comparative perspective mapping past month context to today.
  
  - Output should be structured into 4 distinct sections (or separate messages conceptually).
  - Section 1: Macro & Geopolitical Overview (Wars, broad economic shifts).
  - Section 2: US Data & Monetary Policy (Rate cuts, CPI, NFP, FED speak).
  - Section 3: Deep Gold (XAUUSD) Strategy & Sentiment (Include the Quantitative Sentiment Analysis module here).
  - Section 4: Historical Context (Past month price swings and correlations).
  - Must be highly detailed, structured, easy to navigate, and eye-catching with emojis.
  - Formatted beautifully for Telegram.
  `;
  const response = await executeWithRetry(() => getAI(apiKeyOverride).models.generateContent({
    ...COMMON_CONFIG,
    contents: prompt,
  }));
  return response.text;
}

export async function generateWeeklyGoldAnalysis(apiKeyOverride?: string) {
  const prompt = `
  You are an expert financial market analyst. Provide a VERY DEEP WEEKLY INSIGHT on what happened within the past week in the Gold (XAUUSD) market.
  
  Requirements:
  - IMPORTANT: You MUST use the Google Search tool to fetch the absolute latest weekly recap news, articles, economic data, and real-time closing prices for Gold for this past week.
  - Provide a detailed overview of the week's overall events affecting Gold.
  - Structure the data to show each major event or move in a diverse way (e.g., categorical breakdown, bulleted lists, numeric data points).
  - Provide an insight for the UPCOMING NEXT WEEK based on what happened, stating clearly if you expect Gold to have an UP or DOWN bias overall next week.
  - Must be highly detailed, structured, easy to navigate, and eye-catching with emojis.
  - Formatted beautifully for Telegram.
  `;
  const response = await executeWithRetry(() => getAI(apiKeyOverride).models.generateContent({
    ...COMMON_CONFIG,
    contents: prompt,
  }));
  return response.text;
}

export async function generateWeeklyDXYAnalysis(apiKeyOverride?: string) {
  const prompt = `
  You are an expert financial market analyst. Provide a VERY DEEP WEEKLY INSIGHT on what happened within the past week in the US Dollar Index (DXY) market.
  
  Requirements:
  - IMPORTANT: You MUST use the Google Search tool to fetch the absolute latest weekly recap news, articles, macroeconomic prints, and real-time closing prices for DXY for this past week.
  - Provide a detailed overview of the week's events affecting the US Dollar (e.g., FED speakers, major data releases like NFP/CPI, yield curve changes).
  - Structure the data to show each major event or move in a diverse way (e.g., categorical breakdown, bulleted lists, numeric data points).
  - Provide an insight for the UPCOMING NEXT WEEK based on what happened, stating clearly if you expect DXY to have an UP or DOWN bias overall next week.
  - Must be highly detailed, structured, easy to navigate, and eye-catching with emojis.
  - Formatted beautifully for Telegram.
  `;
  const response = await executeWithRetry(() => getAI(apiKeyOverride).models.generateContent({
    ...COMMON_CONFIG,
    contents: prompt,
  }));
  return response.text;
}

export async function generateGeopoliticalOSINTAnalysis(apiKeyOverride?: string) {
  const prompt = `
  DAILY GEOPOLITICAL SMART-MONEY POSITIONING BRIEFING

  You are an elite macro + OSINT trading analyst. Every day I send this prompt you must run a complete fresh deep dive using all your real-time tools.
  Skip general macroeconomic analysis (NFP, CPI, Fed Rates) as other sections already cover that. Focus strictly and heavily on tension, military and probability metrics. 

  CRITICAL DATA FETCHING REQUIREMENTS:
  - You MUST use the Google Search tool explicitly to find "real-time odds Polymarket geopolitical events escalations" to integrate LIVE probabilities for your predictive analysis.
  - You MUST use the Google Search tool explicitly (e.g. "site:x.com OR site:twitter.com trending geopolitical gold market sentiment") to search for trending topics on Twitter/X related to geopolitical events and market sentiment.
  - You MUST use the Google Search tool explicitly for "latest CFTC Commitment of Traders (COT) report Gold Crude Oil" to fetch and analyze net positions of Managed Money and Large Specs.

  Focus areas (always cover ALL of them in order):

  1. Current Hot Geopolitical Risk Zones
  List the top 2–3 escalating situations right now (Iran/Israel/US, Russia/Ukraine, China/Taiwan, Middle-East flashpoints, or any new surprise). For each one give:
  Probability of major event in next 7–14 days (displaying probabilities directly within the analysis section sourced directly from Polymarket odds + your synthesis).
  Key triggers already visible in open sources.

  2. Prediction Market Snapshot (Polymarket + others)
  Use your Polymarket odds search to pull latest probabilities/volume on any “strike / war / escalation” contracts for the above zones. Highlight if smart money is heavily betting one direction in the last 24–48 h.

  3. Open-Source Military Buildup & Social Sentiment (OSINT & X/Twitter)
  Check and summarize recently reported:
  Flightradar24 / ADS-B: unusual US/Israeli/Chinese/Russian military flights or tanker activity toward the region.
  MarineTraffic: carrier strike groups, amphibious ships...
  Trending topics on X/Twitter: Summarize the current geopolitical and market sentiment based on your Twitter search.
  Flag any clear “positioning before event” signals.

  4. Institutional Positioning in Gold & Related Assets
  Using your CFTC search, present the latest CFTC Commitment of Traders (COT) for Gold and Crude Oil.
  Explicitly display net positions of Managed Money and Large Specs.
  Spot volume spikes or unusual options flow on XAUUSD, USOIL in last 24 h.

  5. News & Narrative Buildup (Buy-the-Rumor Setup)
  Summarize the last 24–48 h headlines from Reuters, AP, Al Jazeera, White House/Iranian statements that show escalation or de-escalation. Highlight any “leaks” or rhetoric that big players would use to front-run.

  6. XAUUSD & Correlated Pairs Trade Setup
  For each hot zone:
  Current XAUUSD price + key levels.
  Expected reaction if event happens (historical “sell the news” magnitude).
  Precise entry plan for “position before event” (long gold on dips during buildup, or short if de-escalation signals dominate).
  Stop-loss and take-profit logic once the event is confirmed.
  Secondary pairs to watch (USOIL, BTC, equities) and why.

  7. Risk & Probability Summary
  One-sentence verdict: “High-confidence pre-event long gold setup” or “Too late / de-escalation risk dominant – stay flat”.
  Overall probability the pattern you described repeats in next 7 days.

  Use tables or bullet points for clarity. Always cite sources inline where possible. End with a short “Actionable Checklist for Today” (3–5 bullet points I can act on immediately).
  Be ruthless with data freshness — ignore anything older than 24 h unless it’s still the dominant narrative. If no major setup exists today, say it clearly instead of forcing one.
  Make it beautifully formatted for Telegram with appropriate emojis.
  `;
  const response = await executeWithRetry(() => getAI(apiKeyOverride).models.generateContent({
    ...COMMON_CONFIG,
    contents: prompt,
  }));
  return response.text;
}
