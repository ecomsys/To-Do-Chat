import { useState, useRef } from "react";
import { ROLE_COLORS } from "../constants";

// Lightbox
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

// Подключаем стор
import useChatStore from "../store/useChatStore";

// Shadcn UI
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Иконки Lucide
import {
  Paperclip,
  Eye,
  Download,
  Play,
  Trash2,
  Music,
  MoreVertical,
} from "lucide-react";

function MessageItem({ msg }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const downloadRef = useRef(null);

  // Данные из стора
  const currentSocketId = useChatStore((state) => state.socket?.id);
  const currentRole = useChatStore((state) => state.role);
  const deleteMessage = useChatStore((state) => state.deleteMessage);

  // Проверка прав на удаление
  const isAuthor = msg.userId === currentSocketId;
  const isProgrammer = currentRole === "Программист";
  const canDelete = isAuthor || isProgrammer;

  // Ключевая переменная: сообщение от программиста?
  const isProgrammerMsg = msg.role === "Программист";

  // Динамические стили для плашек
  const bubbleBg = isProgrammerMsg 
    ? "bg-slate-700 border-slate-600" // Фон программиста (нейтральный темный)
    : "bg-indigo-950/40 border-indigo-800/30"; // Фон остальных (с синеватым оттенком)

  if (msg.type === "file") {
    const isImage = msg.fileType?.startsWith("image/");
    const isVideo = msg.fileType?.startsWith("video/");
    const isAudio = msg.fileType?.startsWith("audio/");
    const fileName = msg.fileName;
    const fileUrl = msg.fileUrl;
    const serverFileName = fileUrl.split("/").pop();
    const downloadUrl = `/download/${encodeURIComponent(serverFileName)}?original=${encodeURIComponent(fileName)}`;

    const slides = [{ src: fileUrl, type: isVideo ? "video" : "image" }];

    return (
      // Корневой контейнер: выравниваем влево или вправо
      <div className={`flex ${isProgrammerMsg ? "justify-start" : "justify-end"} gap-2 group relative mb-3`}>
        
        {/* Аватарка слева (только для программиста) */}
        {isProgrammerMsg && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
            style={{ backgroundColor: ROLE_COLORS[msg.role] }}
          >
            {msg.name?.[0] || "?"}
          </div>
        )}

        <div className="flex flex-col min-w-0 max-w-[75%]">
          {/* Заголовок (Имя, время) - выравниваем в зависимости от стороны */}
          <div className={`flex items-center gap-2 my-2 ${isProgrammerMsg ? "" : "flex-row-reverse"}`}>
            <span className="font-semibold text-white text-sm">{msg.name}</span>
            <span className="text-xs text-slate-400">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: ROLE_COLORS[msg.role] }}
            >
              {msg.role}
            </span>
          </div>

          {/* Плашка файла */}
          <div className={`rounded-lg p-2 border ${bubbleBg}`}>
            {isImage && (
              <img
                src={fileUrl}
                alt={fileName}
                className="max-w-full max-h-48 rounded-md object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setViewerOpen(true)}
              />
            )}

            {isVideo && (
              <div
                className="relative w-full aspect-video rounded-md overflow-hidden cursor-pointer group/video bg-black"
                onClick={() => setViewerOpen(true)}
              >
                <video
                  src={fileUrl}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/video:bg-black/50 transition-colors">
                  <Play className="text-white w-12 h-12 opacity-80" fill="currentColor" />
                </div>
              </div>
            )}

            {isAudio && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1.5 text-sm text-slate-300">
                  <Music className="w-4 h-4 shrink-0 text-slate-400" />
                  <span className="truncate">{fileName}</span>
                </div>
                <audio
                  src={fileUrl}
                  controls
                  className="w-full h-10 rounded-md"
                  preload="metadata"
                />
              </div>
            )}

            {!isImage && !isVideo && !isAudio && (
              <div className="text-slate-300 text-sm mb-1 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 shrink-0 text-slate-400" />
                <span className="truncate">{fileName}</span>
              </div>
            )}

            <div className={`flex items-center justify-between gap-2 ${isImage || isVideo || isAudio ? "mt-3" : ""}`}>
              {!isAudio && (
                <span
                  className="text-sm text-slate-300 truncate flex items-center gap-1.5"
                  title={fileName}
                >
                  <Paperclip className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {fileName}
                </span>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="h-auto p-1 text-blue-400 hover:text-blue-300 cursor-pointer rounded inline-flex items-center ml-auto">
                    <MoreVertical className="w-4 h-4" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isProgrammerMsg ? "end" : "start"} className="min-w-max">
                  {(isImage || isVideo) && (
                    <DropdownMenuItem onClick={() => setViewerOpen(true)}>
                      <Eye className="w-4 h-4 mr-2" /> Открыть
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => downloadRef.current?.click()}>
                    <Download className="w-4 h-4 mr-2" /> Скачать
                  </DropdownMenuItem>
                  {canDelete && (
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Удалить
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <a ref={downloadRef} href={downloadUrl} download={fileName} className="hidden" aria-hidden="true">
              download
            </a>
          </div>

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
                    return <video src={slide.src} controls autoPlay style={{ maxWidth: "100%", maxHeight: "100%", margin: "auto" }} />;
                  }
                  return <img src={slide.src} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", margin: "auto" }} />;
                },
              }}
            />
          )}
        </div>

        {/* Аватарка справа (для всех, кроме программиста) */}
        {!isProgrammerMsg && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
            style={{ backgroundColor: ROLE_COLORS[msg.role] }}
          >
            {msg.name?.[0] || "?"}
          </div>
        )}
      </div>
    );
  }

  // === ТЕКСТОВОЕ СООБЩЕНИЕ ===
  return (
    <div className={`flex ${isProgrammerMsg ? "justify-start" : "justify-end"} gap-2 group relative mb-3`}>
      
      {/* Аватарка слева (Программист) */}
      {isProgrammerMsg && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
          style={{ backgroundColor: ROLE_COLORS[msg.role] }}
        >
          {msg.name?.[0] || "?"}
        </div>
      )}

      <div className="flex flex-col min-w-0 max-w-[75%]">
        {/* Заголовок */}
        <div className={`flex items-center gap-2 my-2 ${isProgrammerMsg ? "" : "flex-row-reverse"}`}>
          <span className="font-semibold text-white text-sm">{msg.name}</span>
          <span className="text-xs text-slate-400">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: ROLE_COLORS[msg.role] }}
          >
            {msg.role}
          </span>
        </div>

        {/* Плашка текста */}
        <div className={`rounded-lg p-2 border ${bubbleBg}`}>
          <p className="text-slate-200 break-words">{msg.message}</p>

          {canDelete && (
            <div className={`flex items-center gap-2 mt-2 ${isProgrammerMsg ? "justify-end" : "justify-end"}`}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="h-auto p-1 text-blue-400 hover:text-blue-300 cursor-pointer rounded inline-flex items-center">
                    <MoreVertical className="w-4 h-4" />
                  </span>
                </DropdownMenuTrigger>
                {/* Выравнивание меню в зависимости от стороны сообщения */}
                <DropdownMenuContent align={isProgrammerMsg ? "end" : "start"} className="min-w-max">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => deleteMessage(msg.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </div>

      {/* Аватарка справа (Остальные) */}
      {!isProgrammerMsg && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
          style={{ backgroundColor: ROLE_COLORS[msg.role] }}
        >
          {msg.name?.[0] || "?"}
        </div>
      )}
    </div>
  );
}

export default MessageItem;