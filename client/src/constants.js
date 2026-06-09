// WebRTC Конфигурация (STUN/TURN серверы)

export const ICE_SERVERS = [
  // Бесплатный STUN Google
  { urls: "stun:stun.l.google.com:19302" },

  // Добавляем свой TURN
  // {
  //   urls: "turn:твой-домен.com:3478",
  //   username: "твой_логин",
  //   credential: "твой_пароль",
  // },
];

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
