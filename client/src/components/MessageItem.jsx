import { useState, useRef } from "react";
import { getRoleColor } from "../constants";

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
  Reply,
} from "lucide-react";

// Компонент цитаты
const ReplyQuote = ({ replyTo }) => {
  if (!replyTo) return null;
  return (
    <div className="border-l-2 border-blue-500 pl-2 mb-1.5 bg-slate-900/30 rounded-r-sm py-1">
      <p className="text-xs font-semibold text-blue-400">{replyTo.name}</p>
      <p className="text-xs text-slate-400 truncate">
        {replyTo.snippet || "..."}
      </p>
    </div>
  );
};

function MessageItem({ msg }) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const downloadRef = useRef(null);

  // Данные из стора (УБРАЛИ currentSocketId)
  const currentRole = useChatStore((state) => state.role);
  const deleteMessage = useChatStore((state) => state.deleteMessage);
  const setReplyingTo = useChatStore((state) => state.setReplyingTo);

  // Проверка прав: сравниваем по РОЛИ, а не по socket.id!
  // Роль не меняется при перезагрузке страницы, в отличие от socket.id
  const isAuthor = msg.role === currentRole;
  const isProgrammer = currentRole === "Программист";
  const canDelete = isAuthor || isProgrammer;

  // Можно отвечать на любое чужое сообщение (убрал !msg.replyTo, чтобы можно было цитировать цитаты)
    const canReply = !isAuthor && !msg.replyTo;

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
    const downloadUrl = `/api/files/download/${encodeURIComponent(serverFileName)}?original=${encodeURIComponent(fileName)}`;

    const slides = [{ src: fileUrl, type: isVideo ? "video" : "image" }];

    return (
      // Корневой контейнер: выравниваем влево или вправо
      <div
        className={`flex ${isProgrammerMsg ? "justify-start" : "justify-end"} gap-2 group relative mb-3`}
      >
        {/* Аватарка слева (только для программиста) */}
        {isProgrammerMsg && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
            style={{ backgroundColor: getRoleColor(msg.role) }}
          >
            {msg.name?.[0] || "?"}
          </div>
        )}

        <div className="flex flex-col min-w-50 sm:min-w-65 max-w-[75%]">
          {/* Заголовок (Имя, время) - выравниваем в зависимости от стороны */}
          <div
            className={`flex items-center gap-2 my-2 ${isProgrammerMsg ? "" : "flex-row-reverse"}`}
          >
            <span className="font-semibold text-white text-sm">{msg.name}</span>
            <span className="text-xs text-slate-400">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: getRoleColor(msg.role) }}
            >
              {msg.role}
            </span>
          </div>

          {/* Плашка файла */}
          <div className={`rounded-lg p-2 border ${bubbleBg}`}>
            <ReplyQuote replyTo={msg.replyTo} />

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
                  <Play
                    className="text-white w-8 h-8 sm:w-12 sm:h-12 opacity-80"
                    fill="currentColor"
                  />
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

            <div
              className={`flex items-center justify-between gap-2 ${isImage || isVideo || isAudio ? "mt-3" : ""}`}
            >
              {!isAudio && (
                <span
                  className="text-sm text-slate-300 truncate flex items-center gap-1.5"
                  title={fileName}
                >
                  <Paperclip className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {fileName}
                </span>
              )}

              {/* Кнопка "Ответить" (только для чужих сообщений) */}
              {canReply && (
                <button
                  onClick={() => setReplyingTo(msg)}
                  className="h-auto p-1 text-slate-400 hover:text-blue-400 cursor-pointer rounded inline-flex items-center transition-colors"
                  title="Ответить"
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <span className="h-auto p-1 text-blue-400 hover:text-blue-300 cursor-pointer rounded inline-flex items-center ml-auto">
                    <MoreVertical className="w-4 h-4" />
                  </span>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align={isProgrammerMsg ? "end" : "start"}
                  className="min-w-max"
                >
                  {(isImage || isVideo) && (
                    <DropdownMenuItem onClick={() => setViewerOpen(true)}>
                      <Eye className="w-4 h-4 mr-2" /> Открыть
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => downloadRef.current?.click()}
                  >
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

        {/* Аватарка справа (для всех, кроме программиста) */}
        {!isProgrammerMsg && (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
            style={{ backgroundColor: getRoleColor(msg.role) }}
          >
            {msg.name?.[0] || "?"}
          </div>
        )}
      </div>
    );
  }

  // === ТЕКСТОВОЕ СООБЩЕНИЕ ===
  return (
    <div
      className={`flex ${isProgrammerMsg ? "justify-start" : "justify-end"} gap-2 group relative mb-3`}
    >
      {/* Аватарка слева (Программист) */}
      {isProgrammerMsg && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
          style={{ backgroundColor: getRoleColor(msg.role) }}
        >
          {msg.name?.[0] || "?"}
        </div>
      )}

      <div className="flex flex-col min-w-50 sm:min-w-65 max-w-[75%]">
        {/* Заголовок */}
        <div
          className={`flex items-center gap-2 my-2 ${isProgrammerMsg ? "" : "flex-row-reverse"}`}
        >
          <span className="font-semibold text-white text-sm">{msg.name}</span>
          <span className="text-xs text-slate-400">
            {new Date(msg.timestamp).toLocaleTimeString()}
          </span>
          <span
            className="text-xs font-medium"
            style={{ color: getRoleColor(msg.role) }}
          >
            {msg.role}
          </span>
        </div>

        {/* Плашка текста */}
        <div className={`rounded-lg p-2 border ${bubbleBg}`}>
          <ReplyQuote replyTo={msg.replyTo} />

          <p className="text-slate-200 break-words">{msg.message}</p>

          {/* Блок действий (появляется при наведении) */}
          {(canReply || canDelete) && (
            <div className="flex items-center gap-1 mt-2 justify-end">
              {/* Кнопка "Ответить" (видна всем на чужих сообщениях) */}
              {canReply && (
                <button
                  onClick={() => setReplyingTo(msg)}
                  className="p-1 text-slate-400 hover:text-blue-400 cursor-pointer rounded transition-colors"
                  title="Ответить"
                >
                  <Reply className="w-4 h-4" />
                </button>
              )}

              {/* Меню с удалением (видно только тем, кому разрешено) */}
              {canDelete && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 text-blue-400 hover:text-blue-300 cursor-pointer rounded inline-flex items-center transition-colors focus:outline-none">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align={isProgrammerMsg ? "end" : "start"}
                    className="min-w-max"
                  >
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => deleteMessage(msg.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Аватарка справа (Остальные) */}
      {!isProgrammerMsg && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs shrink-0 mt-1"
          style={{ backgroundColor: getRoleColor(msg.role) }}
        >
          {msg.name?.[0] || "?"}
        </div>
      )}
    </div>
  );
}

export default MessageItem;
