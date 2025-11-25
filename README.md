# Pracownia Projekt — instrukcja uruchomienia

To repo zawiera:
- frontend React w `frontend/`
- backend Django w `backend/`

Poniżej znajdziesz szczegółową instrukcję krok po kroku jak uruchomić całą aplikację.

--------------------------------------------------------------------------------
1) Przygotowanie sekretów (pieprz, hasła)

- Skopiuj plik przykładowy `.env.example` do pliku `.env` w katalogu głównym repo i ustaw wartości:

```
# POSTGRES_DB=ppdb
# POSTGRES_USER=ppuser
# POSTGRES_PASSWORD=<mocne_haslo_bazy>
# DJANGO_SECRET_KEY=<dlugi_losowy_secret>
# PASSWORD_PEPPER=<tu_wklej_wygenerowany_pieprz>
# DJANGO_DEBUG=1
# CORS_ALLOWED_ORIGINS=http://localhost:3000
```

--------------------------------------------------------------------------------
2) Uruchomienie kodu

Z domyślnego katalogu repozytorium uruchom w terminalu:
```
.\scripts\start-all.ps1
```