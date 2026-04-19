import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Bot, Calendar, Clock, Newspaper, Play, Send, TrendingUp } from "lucide-react";
import { cn } from "./lib/utils";
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./components/ui/Card";
import { generate730AMCalendar, generate7AMBriefing, generate8AMDeepOverview } from "./services/geminiService";
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

  const [autoRunEnabled, setAutoRunEnabled] = useState(false);

  const [chatIdInput, setChatIdInput] = useState(() => localStorage.getItem("TELEGRAM_CHAT_ID") || "");

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
    
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();
    const utcSecond = now.getUTCSeconds();
    
    // Trigger only on the 0th second of the minute to prevent duplicates
    if (utcSecond === 0) {
      if (utcHour === 4 && utcMinute === 0) {
        generate7AMBriefing().then(text => {
          if (text) {
            setBriefingText(text);
            return sendToTelegram(text, chatIdInput);
          }
        }).catch(err => console.error("Auto-run Briefing failed", err));
      }
      if (utcHour === 4 && utcMinute === 30) {
        generate730AMCalendar().then(text => {
          if (text) {
            setCalendarText(text);
            return sendToTelegram(text, chatIdInput);
          }
        }).catch(err => console.error("Auto-run Calendar failed", err));
      }
      if (utcHour === 5 && utcMinute === 0) {
        generate8AMDeepOverview().then(text => {
          if (text) {
            setOverviewText(text);
            return sendToTelegram(text, chatIdInput);
          }
        }).catch(err => console.error("Auto-run Overview failed", err));
      }
    }
  }, [time, autoRunEnabled, chatIdInput]);

  const handleGenerateBriefing = async () => {
    setBriefingLoading(true);
    try {
      const text = await generate7AMBriefing();
      setBriefingText(text || "");
    } catch (err) {
      console.error(err);
      alert("Failed to generate briefing.");
    } finally {
      setBriefingLoading(false);
    }
  };

  const handleGenerateCalendar = async () => {
    setCalendarLoading(true);
    try {
      const text = await generate730AMCalendar();
      setCalendarText(text || "");
    } catch (err) {
      console.error(err);
      alert("Failed to generate calendar.");
    } finally {
      setCalendarLoading(false);
    }
  };

  const handleGenerateOverview = async () => {
    setOverviewLoading(true);
    try {
      const text = await generate8AMDeepOverview();
      setOverviewText(text || "");
    } catch (err) {
      console.error(err);
      alert("Failed to generate overview.");
    } finally {
      setOverviewLoading(false);
    }
  };

  const handleSendToTelegram = async (text: string) => {
    if (!text) return;
    try {
      await sendToTelegram(text, chatIdInput);
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
                localStorage.setItem("TELEGRAM_CHAT_ID", e.target.value);
              }}
              placeholder="-100... (optional override)"
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
            <h1 className="text-4xl md:text-5xl font-black leading-none tracking-[-2px] mt-1">07:00 - 08:00</h1>
          </div>
          <div className="text-left sm:text-right mt-4 sm:mt-0">
            <p className="text-[0.7rem] uppercase tracking-[0.1em] text-[#A1A1AA] font-bold">Current Time (UTC+3)</p>
            <p className="text-2xl font-bold mt-1 text-white font-mono">
              {format(new Date(time.getTime() + 3 * 60 * 60 * 1000), "hh:mm a")}
            </p>
          </div>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-3">
          
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
