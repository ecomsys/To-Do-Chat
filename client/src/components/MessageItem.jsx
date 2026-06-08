import { useState, useRef } from "react";
import { ROLE_COLORS } from "../constants";

// Lightbox
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Shadcn UI
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Иконки Lucide
import { Paperclip, Eye, Download, Play } from "lucide-react";

function MessageItem({ msg }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const downloadRef = useRef(null);

  if (msg.type === "file") {
    const isImage = msg.fileType?.startsWith("image/");
    const isVideo = msg.fileType?.startsWith("video/");
    const fileName = msg.fileName;
    const fileUrl = msg.fileUrl;
    const serverFileName = fileUrl.split("/").pop();
    const downloadUrl = `/download/${encodeURIComponent(serverFileName)}?original=${encodeURIComponent(fileName)}`;

    // Обработчик выбора из Select
    const handleSelectAction = (value) => {
      if (value === "view") {
        setViewerOpen(true);
      } else if (value === "download") {
        if (downloadRef.current) downloadRef.current.click();
      }
    };

    // Настройка слайдов для Lightbox
    const slides = [
      {
        src: fileUrl,
        type: isVideo ? "video" : "image",
      },
    ];

    return (
      <div className="flex items-start gap-2">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
          style={{ backgroundColor: ROLE_COLORS[msg.role] }}
        >
          {msg.name?.[0] || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold text-white">{msg.name}</span>
            <span className="text-xs text-slate-400">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            <span className="text-xs text-slate-400" 
            style={{ color: ROLE_COLORS[msg.role] }}>{msg.role}</span>
          </div>

          <div className="mt-2 bg-slate-800/50 border border-slate-700 rounded-lg p-2 max-w-sm">
            {/* Превью картинки */}
            {isImage && (
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-48 rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewerOpen(true)}
              />
            )}

            {/* Превью видео (с иконкой Play) */}
            {isVideo && (
              <div
                // Добавили aspect-video (16:9) и убрали max-h-48, чтобы пропорции были всегда идеальными
                className="relative w-full aspect-video rounded-md overflow-hidden cursor-pointer group bg-black"
                onClick={() => setViewerOpen(true)}
              >
                <video
                  src={fileUrl}
                  // Абсолютное позиционирование гарантирует, что видео заполнит блок 16:9 ровно по центру
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                  <Play
                    className="text-white w-12 h-12 opacity-80"
                    fill="currentColor"
                  />
                </div>
              </div>
            )}
            {/* Для остальных файлов просто имя с иконкой скрепки */}
            {!isImage && !isVideo && (
              <div className="text-slate-300 text-sm mb-1 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{fileName}</span>
              </div>
            )}

            {/* Блок с именем файла и Select для картинок и видео */}
            {(isImage || isVideo) && (
              <div className="flex items-center justify-between gap-2 mt-2">
                <span
                  className="text-sm text-slate-300 truncate flex items-center gap-1.5"
                  title={fileName}
                >
                  <Paperclip className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {fileName}
                </span>

                <Select onValueChange={handleSelectAction}>
                  <SelectTrigger className="w-auto border-none p-1 h-auto text-xs text-blue-400 hover:text-blue-300 focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder="Действия" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value="view"
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Просмотреть
                    </SelectItem>
                    <SelectItem
                      value="download"
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Скачать
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Для остальных файлов кнопка скачать */}
            {!isImage && !isVideo && (
              <a
                href={downloadUrl}
                download={fileName}
                className="text-blue-400 hover:text-blue-300 text-sm mt-1 inline-flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Скачать
              </a>
            )}

            {/* Скрытая ссылка для скачивания */}
            <a
              ref={downloadRef}
              href={downloadUrl}
              download={fileName}
              className="hidden"
              aria-hidden="true"
            >
              download
            </a>
          </div>

          {/* Модальное окно Lightbox */}
          {(isImage || isVideo) && viewerOpen && (
            <Lightbox
              open={viewerOpen}
              close={() => setViewerOpen(false)}
              slides={slides}
              carousel={{ finite: true }}
              styles={{ container: { backgroundColor: "rgba(0, 0, 0, 0.85)" } }}
              render={{
                slide: ({ slide }) => {
                  if (slide.type === "video") {
                    return (
                      <video
                        src={slide.src}
                        controls
                        autoPlay
                        style={{
                          maxWidth: "100%",
                          maxHeight: "100%",
                          margin: "auto",
                        }}
                      />
                    );
                  }
                  return (
                    <img
                      src={slide.src}
                      alt=""
                      style={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                        margin: "auto",
                      }}
                    />
                  );
                },
              }}
            />
          )}
        </div>
      </div>
    );
  }

  // Текстовое сообщение
  return (
    <div className="flex items-start gap-2">
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0"
        style={{ backgroundColor: ROLE_COLORS[msg.role] }}
      >
        {msg.name?.[0] || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-semibold text-white">{msg.name}</span>
          <span className="text-xs text-slate-400">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
          <span className="text-xs text-slate-400" 
          style={{ color: ROLE_COLORS[msg.role] }}>{msg.role}</span>
        </div>
        <p className="text-slate-300 break-words">{msg.message}</p>
      </div>
    </div>
  );
}

export default MessageItem;
