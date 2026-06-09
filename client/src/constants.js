// WebRTC Конфигурация (STUN/TURN серверы)

export const ICE_SERVERS = [
  // Бесплатный STUN Google
  // { urls: "stun:stun.l.google.com:19302" },

    // ТВОЙ ЛИЧНЫЙ TURN СЕРВЕР
  {
    urls: "turn:31.129.111.75:3478", // <--- ВСТАВЬ IP СВОЕГО VPS
    username: "todochat",               // Логин из конфига Coturn
    credential: "A*f5k*w9XwHB",  // Пароль из конфига Coturn
  },
  
  // Резервный через домен (если домен привязан к IP)
  {
    urls: "turn:todochat.ecomsys.ru:3478", 
    username: "todochat",
    credential: "A*f5k*w9XwHB",
  }
];

export const CALL_TIMEOUT_MS = 30000;  // сколько идет сигнал вызова при звонке в м/с

export const PROGRAMMER_ROLE = "Программист";

// Дефолтные цвета для стандартных ролей и генератор для новых
export const ROLE_COLORS = {
  Дизайнер: "#ec489a",
  Менеджер: "#f59e0b",
  Программист: "#3b82f6",
};

// Функция для генерации цвета новым ролям
export const getRoleColor = (role) => {
  if (ROLE_COLORS[role]) return ROLE_COLORS[role];
  // Генерируем случайный приятный цвет, если роли нет в списке
  let hash = 0;
  for (let i = 0; i < role.length; i++)
    hash = role.charCodeAt(i) + ((hash << 5) - hash);
  const h = hash % 360;
  return `hsl(${h}, 70%, 50%)`;
};
