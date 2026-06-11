# Серверная часть To-Do Chat


```bash
server/
├── src/
│   ├── config/
│   │   ├── roles.json              # здесь хранится база ролей
│   │   └── constants.js              
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── role.controller.js
│   │   └── file.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── upload.middleware.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── role.routes.js
│   │   └── file.routes.js
│   ├── services/
│   │   ├── auth.service.js
│   │   ├── role.service.js
│   │   └── file.service.js
│   └── socket/
│       └── socketHandler.js
├── uploads/                         # сюда грузяться все файлы в чате
├── index.js                         # сервер
├── nodemon.json                     # нужен для исключений в дев режиме
└── package.json                     # зависимости
```

# Как создать свой TURN сервер на VPS для потоковой связи ?

## Шаг 1: Установка Coturn на VPS

```bash
sudo apt update
sudo apt install coturn
```

## Шаг 2: Настройка Coturn

```bash
sudo nano /etc/turnserver.conf
```

Удали всё, что там есть, и вставь этот конфиг (обязательно подставь свой внешний IP сервера и пароль):

```bash
# Внешний IP твоего VPS (ОБЯЗАТЕЛЬНО УКАЖИ СВОЙ!)
external-ip=ТВОЙ_ВНЕШНИЙ_IP

# Порты (стандартные для TURN)
listening-port=3478
tls-listening-port=5349

# Домен (можно указать твой домен или IP сервера)
realm=ТВОЙ_ДОМЕН
server-name=ТВОЙ_ДОМЕН

# Отпечаток для безопасности
fingerprint

# Использовать долгосрочный механизм авторизации (самый надежный для WebRTC)
lt-cred-mech

# Логин и пароль для подключения (ПРИДУМАЙ СЛОЖНЫЙ ПАРОЛЬ!)
# user=todochat:ТВОЙ_СЛОЖНЫЙ_ПАРОЛЬ

# усовершенстрованная безопасность через hmac
use-auth-secret
static-auth-secret=ТВОЙ_СГЕНЕРИРОВАННЫЙ_СЕКРЕТ
realm=ТВОЙ_ДОМЕН

# Отключаем старые небезопасные протоколы
no-tlsv1
no-tlsv1_1

# Безопасность
no-multicast-peers
no-cli

# Логирование (полезно для дебага, потом можно выключить)
log-file=/var/log/turnserver.log
verbose
```


## Шаг 3: Включаем автозапуск сервера

По умолчанию Ubuntu выключает Coturn. Нужно его включить:

```bash
sudo nano /etc/default/coturn
```

Найди строку #TURNSERVER_ENABLED=1, раскомментируй её (убери #), чтобы стало:

```bash
TURNSERVER_ENABLED=1
```

Сохрани и закрой.

Запускаем сервер:

```bash
sudo systemctl restart coturn
sudo systemctl enable coturn
```

Проверь, что он работает:

```bash
sudo systemctl status coturn
```

Должно гореть зеленым active (running).


## Шаг 4: Открытие портов на VPS (ОЧЕНЬ ВАЖНО)

Если у тебя включен фаервол (UFW), WebRTC не сможет работать, потому что порты закрыты. Тебе нужно открыть основной порт и диапазон портов для ретрансляции медиа-трафика:

```bash
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
# Диапазон портов для передачи видео/аудио потока
sudo ufw allow 49152:65535/udp
sudo ufw allow 49152:65535/tcp
```

Если вдруг не пойдет — открой консоль браузера (F12) и пиши мне сюда, что там пишет. И можно глянуть логи (прямо во время звонка) самого TURN-сервера прямо на VPS:


```bash
sudo tail -f /var/log/turnserver.log
```


