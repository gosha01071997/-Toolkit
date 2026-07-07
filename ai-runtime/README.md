# EMC Toolkit Windows AI Pack

Минимальная структура AI Pack для Windows:

```text
ai-runtime/
  bin/win32/emc-ai-runtime.exe
  models/qwen2.5-7b.gguf
  runtime-manifest.json
```

## Runtime

Скачайте Windows-сборку `llama-server.exe` из релизов `llama.cpp` и положите файл сюда:

```text
ai-runtime/bin/win32/emc-ai-runtime.exe
```

Имя файла в приложении фиксированное: `emc-ai-runtime.exe`. Это может быть переименованный `llama-server.exe`.

## Модель

Скачайте GGUF-модель Qwen2.5 7B и положите файл сюда:

```text
ai-runtime/models/qwen2.5-7b.gguf
```

Путь и имя модели должны совпадать с `runtime-manifest.json`.

## Проверка локального ответа модели

Из корня проекта запустите runtime вручную:

```powershell
.\ai-runtime\bin\win32\emc-ai-runtime.exe --model .\ai-runtime\models\qwen2.5-7b.gguf --host 127.0.0.1 --port 39281 --ctx-size 4096
```

В другом окне PowerShell отправьте тестовый запрос:

```powershell
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:39281/completion -ContentType 'application/json' -Body '{"prompt":"Кратко ответь: что проверить при пике излучения 142 MHz?","n_predict":128,"temperature":0.3}'
```

Приложение показывает «AI-модуль готов» только после успешного ответа локального процесса на порту `39281`. Если AI Pack отсутствует или runtime не стартует, UI показывает понятную ошибку без ссылок на Ollama или внешний localhost-сервис.
