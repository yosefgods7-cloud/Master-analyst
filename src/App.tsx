import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Bot, Calendar, Clock, Newspaper, Play, Send, TrendingUp } from "lucide-react";
import { cn } from "./lib/utils";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/Card";
import { generate730AMCalendar, generate7AMBriefing, generate8AMDeepOverview, generateWeeklyGoldAnalysis, generateWeeklyDXYAnalysis, generateGeopoliticalOSINTAnalysis } from "./services/geminiService";
import { sendToTelegram } from "./services/telegramService";

function App() {
  const [time, setTime] = useState(new Date());
  
  // State for 7 AM
  const [briefingText, setBriefingText] = useState("");
  const [briefingLoading, setBriefingLoading] = useState(false);
  
  // State for 7:30 AM
  const [calendarText, setCalendarText] = useState("");
  const [calendarLoading, setCalendarLoading] = useState(false);

  // State for 8 AM
  const [overviewText, setOverviewText] = useState("");
  const [overviewLoading, setOverviewLoading] = useState(false);

  // State for 8:30 AM Geo
  const [geoText, setGeoText] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);

  // State for Weekly Gold 9AM
  const [weeklyGoldText, setWeeklyGoldText] = useState("");
  const [weeklyGoldLoading, setWeeklyGoldLoading] = useState(false);

  // State for Weekly DXY 9AM
  const [weeklyDXYText, setWeeklyDXYText] = useState("");
  const [weeklyDXYLoading, setWeeklyDXYLoading] = useState(false);
  
  const [autoRunEnabled, setAutoRunEnabled] = useState(false);

  const getStorageItem = (key: string) => {
    try {
      return localStorage.getItem(key) || "";
    } catch {
      return "";
    }
  };

  const [chatIdInput, setChatIdInput] = useState(() => getStorageItem("TELEGRAM_CHAT_ID"));
  const [botTokenInput, setBotTokenInput] = useState(() => getStorageItem("TELEGRAM_BOT_TOKEN_OVERRIDE"));
  const [geminiKeyInput, setGeminiKeyInput] = useState(() => getStorageItem("GEMINI_API_KEY_OVERRIDE"));

  // Update real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-Run trigger logic
  useEffect(() => {
    if (!autoRunEnabled) return;

    // We check the schedule.
    // UTC+3 Ethiopia time.
    // 7 AM UTC+3 = 4 AM UTC
    // 7:30 AM UTC+3 = 4:30 AM UTC
    // 8 AM UTC+3 = 5 AM UTC
    // 9 AM UTC+3 = 6 AM UTC
    
    const now = new Date();
    const utcDay = now.getUTCDay();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const utcSecond = now.getUTCSeconds();
    
    // Trigger only on the 0th second of the minute to prevent duplicates
    if (utcSecond === 0) {
      if (utcHour === 4 && utcMinute === 0) {
        generate7AMBriefing(geminiKeyInput).then(text => {
          if (text) {
            setBriefingText(text);
            return sendToTelegram(text, chatIdInput, botTokenInput);
          }
        }).catch(err => console.error("Auto-run Briefing failed", err));
      }
      if (utcHour === 4 && utcMinute === 30) {
        generate730AMCalendar(geminiKeyInput).then(text => {
          if (text) {
            setCalendarText(text);
            return sendToTelegram(text, chatIdInput, botTokenInput);
          }
        }).catch(err => console.error("Auto-run Calendar failed", err));
      }
      if (utcHour === 5 && utcMinute === 0) {
        generate8AMDeepOverview(geminiKeyInput).then(text => {
          if (text) {
            setOverviewText(text);
            return sendToTelegram(text, chatIdInput, botTokenInput);
          }
        }).catch(err => console.error("Auto-run Overview failed", err));
      }
      
      // Bi-Weekly Geopolitical Insights (Sun & Wed 10:00 AM UTC+3 -> 7:00 AM UTC)
      if ((utcDay === 0 || utcDay === 3) && utcHour === 7 && utcMinute === 0) {
        generateGeopoliticalOSINTAnalysis(geminiKeyInput).then(text => {
          if (text) {
            setGeoText(text);
            return sendToTelegram(text, chatIdInput, botTokenInput);
          }
        }).catch(err => console.error("Auto-run Geo failed", err));
      }
      
      // Weekly Sunday Morning Insights
      if (utcDay === 0 && utcHour === 6 && utcMinute === 0) {
        generateWeeklyGoldAnalysis(geminiKeyInput).then(text => {
          if (text) {
            setWeeklyGoldText(text);
            return sendToTelegram(text, chatIdInput, botTokenInput);
          }
        }).catch(err => console.error("Auto-run Weekly Gold failed", err));
        
        generateWeeklyDXYAnalysis(geminiKeyInput).then(text => {
          if (text) {
            setWeeklyDXYText(text);
            return sendToTelegram(text, chatIdInput, botTokenInput);
          }
        }).catch(err => console.error("Auto-run Weekly DXY failed", err));
      }
    }
  }, [time, autoRunEnabled, chatIdInput, botTokenInput, geminiKeyInput]);

  const handleGenerateBriefing = async () => {
    setBriefingLoading(true);
    try {
      const text = await generate7AMBriefing(geminiKeyInput);
      setBriefingText(text || "");
    } catch (err: any) {
      console.error(err);
      alert("Briefing Error: " + (err.message || String(err)));
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleGenerateCalendar = async () => {
    setCalendarLoading(true);
    try {
      const text = await generate730AMCalendar(geminiKeyInput);
      setCalendarText(text || "");
    } catch (err: any) {
      console.error(err);
      alert("Calendar Error: " + (err.message || String(err)));
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleGenerateOverview = async () => {
    setOverviewLoading(true);
    try {
      const text = await generate8AMDeepOverview(geminiKeyInput);
      setOverviewText(text || "");
    } catch (err: any) {
      console.error(err);
      alert("Overview Error: " + (err.message || String(err)));
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleGenerateWeeklyGold = async () => {
    setWeeklyGoldLoading(true);
    try {
      const text = await generateWeeklyGoldAnalysis(geminiKeyInput);
      setWeeklyGoldText(text || "");
    } catch (err: any) {
      console.error(err);
      alert("Weekly Gold Error: " + (err.message || String(err)));
    } finally {
      setWeeklyGoldLoading(false);
    }
  };

  const handleGenerateWeeklyDXY = async () => {
    setWeeklyDXYLoading(true);
    try {
      const text = await generateWeeklyDXYAnalysis(geminiKeyInput);
      setWeeklyDXYText(text || "");
    } catch (err: any) {
      console.error(err);
      alert("Weekly DXY Error: " + (err.message || String(err)));
    } finally {
      setWeeklyDXYLoading(false);
    }
  };

  const handleGenerateGeo = async () => {
    setGeoLoading(true);
    try {
      const text = await generateGeopoliticalOSINTAnalysis(geminiKeyInput);
      setGeoText(text || "");
    } catch (err: any) {
      console.error(err);
      alert("Geo Error: " + (err.message || String(err)));
    } finally {
      setGeoLoading(false);
    }
  };

  const handleSendToTelegram = async (text: string) => {
    if (!text) return;
    try {
      await sendToTelegram(text, chatIdInput, botTokenInput);
      alert("Successfully sent to Telegram!");
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="grid h-screen min-h-screen grid-cols-1 md:grid-cols-[280px_1fr] bg-[#0A0A0A] font-sans text-white overflow-hidden">
      
      {/* Sidebar */}
      <aside className="flex flex-col gap-8 border-r border-[#27272A] bg-[#000] p-8 overflow-y-auto">
        <div className="flex items-center gap-2 text-2xl font-black tracking-tighter">
          XAU<span className="text-[#EAB308]">DXY</span>_BOT
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded border border-green-500/20 bg-green-500/10 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-green-500">
          ● ACTIVE / POLLING
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[#A1A1AA]">Telegram Chat ID</span>
            <input
              type="text"
              value={chatIdInput}
              onChange={(e) => {
                setChatIdInput(e.target.value);
                try { localStorage.setItem("TELEGRAM_CHAT_ID", e.target.value); } catch {}
              }}
              placeholder="-100... (optional)"
              className="rounded border border-[#27272A] bg-[#111] p-2 text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[#A1A1AA]">Telegram Bot Token</span>
            <input
              type="password"
              value={botTokenInput}
              onChange={(e) => {
                setBotTokenInput(e.target.value);
                try { localStorage.setItem("TELEGRAM_BOT_TOKEN_OVERRIDE", e.target.value); } catch {}
              }}
              placeholder="1234:ABC... (for static hosting)"
              className="rounded border border-[#27272A] bg-[#111] p-2 text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[#A1A1AA]">Gemini API Key</span>
            <input
              type="password"
              value={geminiKeyInput}
              onChange={(e) => {
                setGeminiKeyInput(e.target.value);
                try { localStorage.setItem("GEMINI_API_KEY_OVERRIDE", e.target.value); } catch {}
              }}
              placeholder="AIzaSy... (for static hosting)"
              className="rounded border border-[#27272A] bg-[#111] p-2 text-xs font-mono text-white focus:outline-none focus:border-[#EAB308]"
            />
          </div>
        </div>
      
        <div className="mt-auto flex flex-col gap-4">
          <div className="flex flex-col gap-2 mb-4">
            <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[#A1A1AA]">Auto-Run Schedule</span>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setAutoRunEnabled((val) => !val)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                  autoRunEnabled ? "bg-[#EAB308]" : "bg-[#27272A]"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-black transition-transform",
                    autoRunEnabled ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
              <span className="text-sm font-bold">{autoRunEnabled ? "ON" : "OFF"}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-[#A1A1AA]">Current Time (UTC)</span>
            <span className="rounded border border-[#27272A] bg-[#111] p-3 font-mono text-sm text-white">
                {format(time, "HH:mm:ss")}
            </span>
          </div>
        </div>
      </aside>

      {/* Main View */}
      <main className="flex h-full flex-col p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#27272A] pb-4">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[#EAB308] font-bold">Daily Analysis Cycle</p>
            <h1 className="text-4xl md:text-5xl font-black leading-none tracking-[-2px] mt-1">07:00 - 08:30</h1>
          </div>
          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <p className="text-[0.7rem] uppercase tracking-[0.1em] text-[#A1A1AA] font-bold">Current Time (UTC+3)</p>
            <p className="text-2xl font-bold mt-1 text-white font-mono">
              {format(new Date(time.getTime() + 3 * 60 * 60 * 1000), "hh:mm a")}
            </p>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          
          {/* Card 1 */}
          <Card>
            <div className="absolute -top-1 right-2 font-mono text-5xl font-extrabold text-white/5">07:00</div>
            <CardHeader>
              <CardTitle>Round 1</CardTitle>
              <p className="text-[0.8rem] text-[#A1A1AA]">Market Briefing & Status</p>
            </CardHeader>
            <CardContent>
              <textarea
                value={briefingText}
                onChange={(e) => setBriefingText(e.target.value)}
                placeholder="Generated analysis will appear here..."
                className="h-full min-h-[250px] w-full resize-none rounded bg-[#0F0F10] border border-[#1A1A1C] p-4 text-[0.85rem] leading-snug text-white focus:border-[#EAB308] focus:outline-none"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateBriefing} 
                disabled={briefingLoading}
                className="w-full sm:w-auto"
              >
                {briefingLoading ? "Generating..." : "Generate"}
              </Button>
              <Button 
                onClick={() => handleSendToTelegram(briefingText)}
                disabled={!briefingText}
                variant="outline"
                className="w-full sm:w-auto text-[#EAB308]"
              >
                Dispatch
              </Button>
            </CardFooter>
          </Card>

          {/* Card 2 */}
          <Card>
            <div className="absolute -top-1 right-2 font-mono text-5xl font-extrabold text-white/5">07:30</div>
            <CardHeader>
              <CardTitle>Round 2</CardTitle>
              <p className="text-[0.8rem] text-[#A1A1AA]">Economic Calendar (FX Factory)</p>
            </CardHeader>
            <CardContent>
              <textarea
                value={calendarText}
                onChange={(e) => setCalendarText(e.target.value)}
                placeholder="Generated calendar will appear here..."
                className="h-full min-h-[250px] w-full resize-none rounded bg-[#0F0F10] border border-[#1A1A1C] p-4 text-[0.85rem] leading-snug text-white focus:border-[#EAB308] focus:outline-none"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateCalendar} 
                disabled={calendarLoading}
                className="w-full sm:w-auto"
              >
                {calendarLoading ? "Generating..." : "Generate"}
              </Button>
              <Button 
                onClick={() => handleSendToTelegram(calendarText)}
                disabled={!calendarText}
                variant="outline"
                className="w-full sm:w-auto text-[#EAB308]"
              >
                Dispatch
              </Button>
            </CardFooter>
          </Card>

          {/* Card 3 */}
          <Card>
            <div className="absolute -top-1 right-2 font-mono text-5xl font-extrabold text-white/5">08:00</div>
            <CardHeader>
              <CardTitle>Round 3</CardTitle>
              <p className="text-[0.8rem] text-[#A1A1AA]">Gold Deep Dive & Sentiment</p>
            </CardHeader>
            <CardContent>
              <textarea
                value={overviewText}
                onChange={(e) => setOverviewText(e.target.value)}
                placeholder="Deep 3-part overview will appear here..."
                className="h-full min-h-[250px] w-full resize-none rounded bg-[#0F0F10] border border-[#1A1A1C] p-4 text-[0.85rem] leading-snug text-white focus:border-[#EAB308] focus:outline-none"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateOverview} 
                disabled={overviewLoading}
                className="w-full sm:w-auto"
              >
                {overviewLoading ? "Generating..." : "Generate"}
              </Button>
              <Button 
                onClick={() => handleSendToTelegram(overviewText)}
                disabled={!overviewText}
                variant="outline"
                className="w-full sm:w-auto text-[#EAB308]"
              >
                Dispatch
              </Button>
            </CardFooter>
          </Card>

          {/* Card 4 (Geopolitics & OSINT) */}
          <Card className="border-red-500/20">
            <div className="absolute -top-1 right-2 font-mono text-5xl font-extrabold text-red-500/5">08:30</div>
            <CardHeader>
              <CardTitle>Round 4</CardTitle>
              <p className="text-[0.8rem] text-red-400">Geopolitics & OSINT Polymarket</p>
            </CardHeader>
            <CardContent>
              <textarea
                value={geoText}
                onChange={(e) => setGeoText(e.target.value)}
                placeholder="Geopolitical & Polymarket insights will appear here..."
                className="h-full min-h-[250px] w-full resize-none rounded bg-[#0F0F10] border border-[#1A1A1C] p-4 text-[0.85rem] leading-snug text-white focus:border-red-500 focus:outline-none"
              />
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateGeo} 
                disabled={geoLoading}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
              >
                {geoLoading ? "Generating..." : "Generate GEO"}
              </Button>
              <Button 
                onClick={() => handleSendToTelegram(geoText)}
                disabled={!geoText}
                variant="outline"
                className="w-full sm:w-auto text-red-500 border-red-500 hover:bg-red-500/10"
              >
                Dispatch GEO
              </Button>
            </CardFooter>
          </Card>

        </div>

        <header className="mb-4 mt-8 lg:mt-16 flex flex-col sm:flex-row sm:items-end justify-between border-b border-[#27272A] pb-4">
          <div>
            <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[#EAB308] font-bold">Weekly Analysis Cycle</p>
            <h1 className="text-3xl md:text-4xl font-black leading-none tracking-[-2px] mt-1">Sun <span className="font-mono text-[#A1A1AA]">09:00</span></h1>
          </div>
        </header>
        
        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Card 4 Weekly Gold */}
            <Card>
              <div className="absolute -top-1 right-2 font-mono text-5xl font-extrabold text-[#EAB308]/5">XAU</div>
              <CardHeader>
                <CardTitle>Weekly Gold</CardTitle>
                <p className="text-[0.8rem] text-[#A1A1AA]">Deep Review & Forward Insight</p>
              </CardHeader>
              <CardContent>
                <textarea
                  value={weeklyGoldText}
                  onChange={(e) => setWeeklyGoldText(e.target.value)}
                  placeholder="Weekly gold analysis will appear here..."
                  className="h-full min-h-[250px] w-full resize-none rounded bg-[#0F0F10] border border-[#1A1A1C] p-4 text-[0.85rem] leading-snug text-white focus:border-[#EAB308] focus:outline-none"
                />
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGenerateWeeklyGold} 
                  disabled={weeklyGoldLoading}
                  className="w-full sm:w-auto"
                >
                  {weeklyGoldLoading ? "Generating..." : "Generate Insights"}
                </Button>
                <Button 
                  onClick={() => handleSendToTelegram(weeklyGoldText)}
                  disabled={!weeklyGoldText}
                  variant="outline"
                  className="w-full sm:w-auto text-[#EAB308]"
                >
                  Dispatch
                </Button>
              </CardFooter>
            </Card>

            {/* Card 5 Weekly DXY */}
            <Card>
                <div className="absolute -top-1 right-2 font-mono text-5xl font-extrabold text-blue-500/5">DXY</div>
                <CardHeader>
                  <CardTitle>Weekly DXY</CardTitle>
                  <p className="text-[0.8rem] text-[#A1A1AA]">Deep Review & Forward Insight</p>
                </CardHeader>
                <CardContent>
                  <textarea
                    value={weeklyDXYText}
                    onChange={(e) => setWeeklyDXYText(e.target.value)}
                    placeholder="Weekly DXY analysis will appear here..."
                    className="h-full min-h-[250px] w-full resize-none rounded bg-[#0F0F10] border border-[#1A1A1C] p-4 text-[0.85rem] leading-snug text-white focus:border-blue-500 focus:outline-none"
                  />
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleGenerateWeeklyDXY} 
                    disabled={weeklyDXYLoading}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {weeklyDXYLoading ? "Generating..." : "Generate Insights"}
                  </Button>
                  <Button 
                    onClick={() => handleSendToTelegram(weeklyDXYText)}
                    disabled={!weeklyDXYText}
                    variant="outline"
                    className="w-full sm:w-auto text-blue-500 border-blue-500 hover:bg-blue-500/10"
                  >
                    Dispatch
                  </Button>
                </CardFooter>
            </Card>
        </div>

        <footer className="mt-8 flex flex-col sm:flex-row justify-between border-t border-dotted border-[#27272A] pt-4 text-[0.7rem] uppercase tracking-widest text-[#A1A1AA] gap-2">
           <div>Automated via Express Backend API</div>
           <div>Ethiopian Time (UTC+3) Schedule Active</div>
        </footer>
      </main>
    </div>
  );
}

export default App;
