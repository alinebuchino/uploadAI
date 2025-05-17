"use client";

import { useCompletion } from "ai/react";
import { Moon, Sun, Wand2 } from "lucide-react";
import { useEffect, useState } from "react";
import ChatbotWidget from "./components/chatbot/ChatbotWidget";
import { PromptSelect } from "./components/prompt-select";
import { Button } from "./components/ui/button";
import { Label } from "./components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { Separator } from "./components/ui/separator";
import { Slider } from "./components/ui/slider";
import { Textarea } from "./components/ui/textarea";
import { VideoInputForm } from "./components/video-input-form";

function ModeToggleInternal({ currentTheme, toggleTheme }: { currentTheme: string, toggleTheme: () => void }) {
  return (
    <Button
      variant="outline"
      onClick={toggleTheme}
      aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
      className="p-2"
    >
      {currentTheme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
}

export function App() {
  const [temperatura, setTemperatura] = useState(0.5);
  const [videoId, setVideoId] = useState<string | null>(null);

  const getInitialTheme = (): string => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("appTheme");
      if (storedTheme === "light" || storedTheme === "dark") {
        return storedTheme;
      }
    }
    return "dark";
  };

  const [theme, setThemeState] = useState<string>(getInitialTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light-theme", "dark-theme");

    if (theme === "light") {
      root.classList.add("light-theme");
    }
    localStorage.setItem("appTheme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  const {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    completion,
    isLoading,
  } = useCompletion({
    api: "http://localhost:3333/ai/complete",
    body: { videoId, temperatura },
    headers: { "Content-Type": "application/json" },
  });

  const handleNewVideoFileSelected = () => {
    setVideoId(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="px-6 py-3 flex items-center justify-between border-b">
        <div className="flex items-center">
          <img src="src/img/favicon.png" alt="Upload AI Logo" className="w-8 h-8 mb-1" />
          <h1 className="text-xl font-bold">pload AI</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            O poder da IA no seu upload!
            Gere títulos, descrições e transcrições automáticas para seus vídeos em segundos! 📹🚀
          </span>
          <Separator orientation="vertical" className="h-6" />
          <ModeToggleInternal currentTheme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>

      <ChatbotWidget />
      <main className="flex-1 p-6 flex gap-6">
        <div className="flex flex-col flex-1 gap-4">
          <div className="grid grid-rows-2 gap-4 flex-1">
            <Textarea
              className="resize-none p-4 leading-relaxed"
              placeholder="Selecione o que deseja gerar. A IA criará o prompt automaticamente para você!"
              value={input}
              onChange={handleInputChange}
              disabled={isLoading}
            />
            <Textarea
              className="resize-none p-4 leading-relaxed"
              placeholder="Resultado gerado pela IA"
              readOnly
              value={completion}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Observação: você pode utilizar a variável{" "}
            <code className="text-red-500">{"{transcription}"}</code>
            no seu prompt para adicionar o conteúdo da transcrição do vídeo selecionado.
          </p>
        </div>

        <aside className="w-80 space-y-6 p-6 rounded-lg">
          <VideoInputForm
            onVideoUploaded={setVideoId}
            onNewFileSelected={handleNewVideoFileSelected}
          />
          <Separator />
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>O que a IA irá gerar</Label>
              <PromptSelect onPromptSelect={setInput} />
            </div>
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select disabled defaultValue="gemini-2.0-flash">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gemini-2.0-flash">gemini-2.0-flash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="temperature-slider">Temperatura</Label>
                <span className="text-sm text-muted-foreground font-medium">
                  {temperatura.toFixed(1)}
                </span>
              </div>
              <Slider
                id="temperature-slider"
                min={0} max={1} step={0.1}
                value={[temperatura]}
                onValueChange={(value) => setTemperatura(value[0])}
                disabled={isLoading}
              />
              <span className="block text-xs text-muted-foreground italic leading-relaxed">
                Valores mais altos tendem a deixar o resultado mais criativo
                porém com margens maiores de possíveis erros.
              </span>
            </div>
            <Separator />
            <Button
              disabled={isLoading || !videoId || !input.trim()}
              type="submit"
              className="w-full"
            >
              Executar
              <Wand2 className="w-4 h-4 ml-2" />
            </Button>
          </form>
        </aside>
      </main>
      <ChatbotWidget />
    </div>
  );
}