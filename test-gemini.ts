import { generate7AMBriefing } from "./src/services/geminiService.ts";

async function run() {
  try {
    const res = await generate7AMBriefing(process.env.GEMINI_API_KEY);
    console.log("SUCCESS:");
    console.log(res);
  } catch(err) {
    console.error("FAIL:", err);
  }
}
run();
