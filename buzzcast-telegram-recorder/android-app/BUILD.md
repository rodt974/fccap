# BuzzCast Private Stream Recorder - Android App

## Comment builder l'APK

### Option 1: Android Studio (le plus simple)
1. Ouvre Android Studio
2. File > Open > selectionne le dossier `android-app`
3. Attends que Gradle sync
4. Build > Build Bundle(s) / APK(s) > Build APK(s)
5. L'APK sera dans `app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Ligne de commande
```bash
# Installe Android SDK si pas deja fait
# export ANDROID_HOME=/path/to/android/sdk

cd android-app
chmod +x gradlew  # si tu utilises le wrapper
./gradlew assembleDebug

# APK: app/build/outputs/apk/debug/app-debug.apk
```

## Configuration dans l'app

### Buzzcast
- **User ID**: Ton ID utilisateur BuzzCast (ex: 8878046)
- **Token**: Ton token d'auth (visible dans localStorage du StreamCatcher)
- **Watch IDs**: IDs des users a surveiller (separes par virgule). Vide = tous les favoris.

### Telegram
1. Cree un bot via @BotFather sur Telegram -> copie le token
2. Envoie un message a ton bot
3. Va sur https://api.telegram.org/bot<TON_TOKEN>/getUpdates pour trouver ton chat_id
4. Colle le bot token et chat_id dans l'app

### Options
- **Prives uniquement**: N'enregistre que les streams prives
- **Intervalle**: Frequence de verification en secondes (min 10s)

## Fonctionnement
- L'app tourne en service d'arriere-plan (foreground service)
- Elle verifie periodiquement si les users surveilles sont en live
- Si un stream prive est detecte, elle telecharge le FLV
- Quand le stream se termine, l'enregistrement est envoye sur Telegram
- Les fichiers sont stockes dans le dossier de l'app sur le telephone
