# TASKA 0.6 — Telegram Mini App

## Что уже работает

Мобильный интерфейс с тёмной палитрой Lemon / Pink / Lilac / Navy, обе роли, поиск и фильтры, профили и черновики задач. Интерфейсы откликов, переписки, принятия работы, правок и отзывов сохранены для интеграции с API. Вымышленные пользователи, автоответы, симуляция платежей и кнопки тестирования удалены. Профили и черновики сохраняются на устройстве; публичная публикация, обмен сообщениями и уведомления требуют серверной интеграции. Это ещё не версия для публичного запуска. Встроена поддержка Telegram Web App SDK и запроса разрешения на уведомления, но не серверная авторизация.

## Запуск

```bash
python3 -m http.server 8000
```

Открой http://localhost:8000/ — интерфейс Mini App отображается по умолчанию.

## Как создать своего бота и подключить приложение

1. Открой @BotFather, отправь `/newbot`, выбери название и свободный username, который заканчивается на `bot`. Сохрани токен в безопасном месте. Не отправляй его в чат и не коммить в GitHub.
2. Опубликуй эту версию фронтенда на HTTPS (например, GitHub Pages). Для репозитория `zdarzuzz/TASKA` это будет `https://zdarzuzz.github.io/TASKA/`, если публикация настроена на корень main. До подключения API используй ссылку только для закрытой проверки.
3. В @BotFather отправь `/setmenubutton`, выбери нового бота, введи название кнопки `Открыть ТАСКУ` и HTTPS-ссылку.
4. Открой чат бота, нажми кнопку. В «Событиях» можно запросить разрешение Telegram на сообщения, но реальная отправка требует сервера.
5. Не помещай токен бота или Supabase service_role в GitHub Pages, JS или Figma. Секреты будут переменными окружения Node.js на сервере.

## Предлагаемая архитектура реального MVP

- Фронтенд: этот HTML/CSS/JS + Telegram Web App SDK.
- API: Node.js (например, на существующем VPS), HTTPS. При входе клиент отправляет `Telegram.WebApp.initData`, сервер проверяет подпись по официальному алгоритму Telegram, свежесть `auth_date` и создаёт короткоживущую сессию. Не доверять `initDataUnsafe`, роли, статусу и идентификаторам из клиента.
- Хранилище: Supabase/PostgreSQL, миграции, ограничение доступа по участникам сделки. При прямом доступе клиентов необходимы RLS. Привилегированный ключ должен оставаться только на сервере.
- Сервис уведомлений: после успешной транзакции создаётся запись в `notifications` и очередь доставки. Сервер отправляет разрешённому получателю уведомление через Bot API `sendMessage`; ошибки доставки повторяются с ограничением, состояние прочтения сохраняется отдельно.

| Таблица | Основные поля |
|---|---|
| users | id, telegram_id unique, display_name, created_at |
| profiles | id, user_id, role, name, about, skills, portfolio |
| tasks | id, owner_profile_id, title, description, category, budget, deadline, status |
| applications | id, task_id, student_profile_id, message, status, unique(task_id, student_profile_id) |
| conversations | id, task_id, customer_profile_id, student_profile_id |
| messages | id, conversation_id, sender_profile_id, body, created_at |
| submissions | id, task_id, version, link, comment, created_at |
| notifications | id, recipient_user_id, task_id, event_type, read_at, created_at |
| notification_outbox | notification_id unique, delivery_status, attempts, next_attempt_at |
| reviews | id, task_id, author_profile_id, target_profile_id, rating, body |

Порядок внедрения: создание бота → авторизация → профили → задачи и отклики → чат → события и очередь уведомлений → бот → интеграционные тесты двух реальных пользователей. Проверять права и допустимые переходы статусов на сервере. Не имитировать платежи; подключение платежей — отдельный этап.

Документация: https://core.telegram.org/bots/webapps и https://core.telegram.org/bots/api
