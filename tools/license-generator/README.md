# EMC Toolkit License Generator

Эта локальная утилита правообладателя не входит в `electron-builder.files` и работает без сети.

## Первичная настройка

1. На доверенном офлайн-компьютере выполните `node tools/license-generator/generate-keypair.cjs`.
2. Скопируйте выведенный public key в `src/license/publicKey.js` и выпустите новую сборку приложения.
3. Перенесите `private-key.pem` в зашифрованное хранилище (аппаратный токен, зашифрованный офлайн-носитель или менеджер секретов с резервной копией). Не отправляйте его покупателям и не добавляйте в Git.

Утрата private key исключает выпуск новых совместимых лицензий; утечка требует замены пары ключей и новой сборки приложения.

## Выпуск лицензии

Интерактивно:

```sh
node tools/license-generator/index.cjs
```

Автоматизированно:

```sh
node tools/license-generator/index.cjs --edition personal --id EMC-000001 --expires never
node tools/license-generator/index.cjs --edition pro --id EMC-000002 --expires 2027-12-31
```

Путь к ключу можно задать флагом `--private-key /secure/path/private-key.pem` или переменной `EMC_LICENSE_PRIVATE_KEY`. Получившуюся строку можно безопасно отправить покупателю; private key при этом никуда не передаётся.
