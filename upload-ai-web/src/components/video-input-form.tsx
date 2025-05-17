import { api } from "@/lib/axios";
import { getFFmpeg } from "@/lib/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import { FileVideo, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Textarea } from "./ui/textarea";

type Status = "waiting" | "converting" | "uploading" | "generating" | "success";

const statusMessages = {
  converting: "Convertendo...",
  generating: "Transcrevendo...",
  uploading: "Carregando...",
  success: "Sucesso!",
};

interface VideoInputFormProps {
  onVideoUploaded: (id: string) => void;
  onNewFileSelected: () => void;
}

export function VideoInputForm(props: VideoInputFormProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("waiting");

  const promptInputRef = useRef<HTMLTextAreaElement>(null);

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    props.onNewFileSelected();

    const { files } = event.currentTarget;

    if (promptInputRef.current) {
      promptInputRef.current.value = "";
    }

    if (!files || files.length === 0) {
      setVideoFile(null);
      setStatus("waiting");
      return;
    }

    const selectedFile = files[0];
    setVideoFile(selectedFile);
    setStatus("waiting");
  }

  async function convertVideoToAudio(video: File) {
    console.log("Convert started.");
    const ffmpeg = await getFFmpeg();
    await ffmpeg.writeFile("input.mp4", await fetchFile(video));
    ffmpeg.on("progress", (progress) => {
      console.log("Convert progress: " + Math.round(progress.progress * 100));
    });
    await ffmpeg.exec([
      "-i", "input.mp4", "-map", "0:a", "-b:a", "20k",
      "-acodec", "libmp3lame", "output.mp3",
    ]);
    const data = await ffmpeg.readFile("output.mp3");
    const audioFileBlob = new Blob([data], { type: "audio/mp3" });
    const audioFile = new File([audioFileBlob], "output.mp3", {
      type: "audio/mpeg",
    });
    console.log("Convert finished.");
    return audioFile;
  }

  async function handleUploadVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = promptInputRef.current?.value;
    if (!videoFile) {
      return;
    }
    setStatus("converting");
    const audioFile = await convertVideoToAudio(videoFile);
    const data = new FormData();
    data.append("file", audioFile);
    setStatus("uploading");
    const response = await api.post("/videos", data);
    const videoId = response.data.video.id;
    setStatus("generating");
    await api.post(`/videos/${videoId}/transcription`, { prompt });
    setStatus("success");
    props.onVideoUploaded(videoId);
  }

  const previewURL = useMemo(() => {
    if (!videoFile) {
      return null;
    }
    const currentUrl = URL.createObjectURL(videoFile);
    return () => URL.revokeObjectURL(currentUrl);
  }, [videoFile]);


  const labelClasses = `
    relative border flex rounded-md aspect-video cursor-pointer
    text-sm flex-col gap-2 items-center justify-center
    text-muted-foreground hover:bg-primary/5
    transition-colors
    ${previewURL && videoFile
      ? 'border-solid'
      : 'border-red-600 border-dashed'
    }
  `;


  return (
    <form onSubmit={handleUploadVideo} className="space-y-6">
      <label
        htmlFor="video"
        className={labelClasses}
      >
        {previewURL && videoFile ? (
          <video
            src={URL.createObjectURL(videoFile)}
            controls={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <FileVideo className="w-4 h-4" />
            Selecione um vídeo
          </>
        )}
      </label>

      <input
        type="file"
        id="video"
        accept="video/mp4"
        className="sr-only"
        onChange={handleFileSelected}
      />

      <Separator />

      <div className="space-y-2">
        <Label htmlFor="transcription_prompt">Prompt de transcrição</Label>
        <Textarea
          ref={promptInputRef}
          disabled={status !== "waiting"}
          id="transcription_prompt"
          className="h-20 leading-relaxed resize-none"
          placeholder="Inclua palavras-chave mencionadas no vídeo separadas por vírgula (,)"
        />
      </div>

      <Button
        data-success={status === "success"}
        disabled={status !== "waiting" || !videoFile}
        type="submit"
        className="w-full data-[success=true]:bg-green-900"
      >
        {status === "waiting" ? (
          videoFile ? (
            <>
              Carregar vídeo
              <Upload className="w-4 h-4 ml-2" />
            </>
          ) : (
            "Selecione um vídeo para carregar"
          )
        ) : (
          statusMessages[status]
        )}
      </Button>
    </form>
  );
}