# PracowniaProjekt — instrukcja uruchomienia (krok po kroku)

To repo zawiera:
- frontend React w `frontend/`
- backend Django w `backend/`

Poniżej znajdziesz szczegółową instrukcję krok po kroku jak to uruchomić lokalnie (Docker) lub bez Dockera, jak bezpiecznie ustawić "pieprz" (PASSWORD_PEPPER), oraz jak przetestować rejestrację/logowanie.

UWAGA: To demo ma ustawienia wygodne do developmentu. Przed wdrożeniem do produkcji przeczytaj sekcję "Produkcja / bezpieczeństwo" niżej.

--------------------------------------------------------------------------------
1) Przygotowanie sekretów (pieprz, hasła)

- Wygeneruj bezpieczny pieprz (PASSWORD_PEPPER) w PowerShell:
```powershell
$bytes = New-Object byte[] 32; (New-Object System.Security.Cryptography.RNGCryptoServiceProvider).GetBytes($bytes); [Convert]::ToBase64String($bytes)
# Skopiuj otrzymany ciąg — to będzie Twój PASSWORD_PEPPER
```

- Skopiuj plik przykładowy `.env.example` do pliku `.env` w katalogu głównym repo i ustaw wartości:
```powershell
cp .env.example .env
# Otwórz .env w edytorze i ustaw co najmniej:
# POSTGRES_DB=ppdb
# POSTGRES_USER=ppuser
# POSTGRES_PASSWORD=<mocne_haslo_bazy>
# DJANGO_SECRET_KEY=<dlugi_losowy_secret>
# PASSWORD_PEPPER=<tu_wklej_wygenerowany_pieprz>
# DJANGO_DEBUG=1
# CORS_ALLOWED_ORIGINS=http://localhost:3000
```

- Plik `.env` jest dodany do `.gitignore` i nie trafi do Gita.

--------------------------------------------------------------------------------
2) Uruchomienie (opcja A) — Docker Compose (zalecane dla prostego uruchomienia z Postgres)

- Z katalogu z repozytorium uruchom:
```powershell
docker-compose up --build -d
```

- Spowoduje to uruchomienie usługi `db` (Postgres) i `web` (Django). Backend będzie dostępny na `http://localhost:8000`.

- Następnie uruchom frontend w oddzielnym oknie PowerShell:
```powershell
cd frontend
npm install
npm start
```

- Frontend domyślnie startuje na `http://localhost:3000` i komunikuje się z API pod `/api/v1/` (czyli `http://localhost:8000/api/v1/`).

Uwaga: aby kontener `web` otrzymał zmienną `PASSWORD_PEPPER` z `.env`, upewnij się, że w `docker-compose.yml` w sekcji `web.environment` znajduje się linia:
```yaml
	- PASSWORD_PEPPER=${PASSWORD_PEPPER}
```
Jeżeli nie — możesz ustawić zmienną przed uruchomieniem `docker-compose` w PowerShell:
```powershell
$env:PASSWORD_PEPPER='(tu_twój_pieprz)'
docker-compose up --build -d
```

--------------------------------------------------------------------------------
3) Uruchomienie bez Dockera (opcja B) — lokalny backend i frontend

- Backend (Windows PowerShell):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# ustaw zmienne środowiskowe localnie (tymczasowo w sesji PowerShell):
$env:PASSWORD_PEPPER = '<twoj_pieprz>'
$env:DJANGO_SECRET_KEY = '<twoj_secret>'
$env:DJANGO_DEBUG = '1'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:3000'

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

- Frontend (oddzielne okno PowerShell):
```powershell
cd frontend
npm install
npm start
```

--------------------------------------------------------------------------------
4) Testowanie API (proste przykłady)

- Rejestracja (POST JSON):
```powershell
# przykładowy curl (PowerShell):
curl -Uri http://localhost:8000/api/v1/register/ -Method POST -Body (ConvertTo-Json @{email='a@b.c'; password='pass1234'; confirmPassword='pass1234'}) -ContentType 'application/json'
```

- Logowanie (POST JSON):
```powershell
curl -Uri http://localhost:8000/api/v1/login/ -Method POST -Body (ConvertTo-Json @{email='a@b.c'; password='pass1234'}) -ContentType 'application/json'
```

W odpowiedzi na sukces backend zwraca `token` (access) i `refresh`. Frontend demo zapisuje te tokeny w `localStorage`.

--------------------------------------------------------------------------------
5) Gdzie i jak używany jest pieprz (bez kodu)

- `PASSWORD_PEPPER` odczytywany jest z `os.environ` w `backend/ppbackend/settings.py`.
- W `api/hashers.py` dodatkowy sekret (pieprz) jest dołączany do hasła zanim zostanie zhashowane (i przy weryfikacji). Pieprz NIE JEST zapisywany w bazie — zapisane są sól i hash.

--------------------------------------------------------------------------------
6) Produkcja i bezpieczeństwo — krótkie wskazówki

- Nie używaj `CORS_ALLOWED_ORIGINS=*` w produkcji; ustaw konkretne originy (np. `https://app.example.com`).
- Używaj managera sekretów (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault) zamiast `.env` w produkcji.
- Używaj `gunicorn` + Nginx (zobacz sekcję WSGI w repo) zamiast `runserver`.
- Preferuj bezpieczne przechowywanie tokenów (refresh tokeny w httpOnly cookies).

--------------------------------------------------------------------------------
7) Przydatne pliki i skrypty w repo

- `docker-compose.yml` — uruchamia `db` (postgres) i `web` (Django). Zmodyfikuj sekcję `web.environment`, by przekazywała `PASSWORD_PEPPER`.
- `backend/Dockerfile` — buduje obraz Django (domyślnie uruchamia dev server). Dla produkcji zmień CMD na `gunicorn ppbackend.wsgi:application ...`.
- `scripts/start-all.ps1` — skrypt PowerShell uruchamiający `docker-compose` i frontend dev server (jedno polecenie wygodnie startuje obie części).

--------------------------------------------------------------------------------
Masz dwie opcje — chcesz, żebym teraz:
1. Dodał linię `- PASSWORD_PEPPER=${PASSWORD_PEPPER}` do `docker-compose.yml` i wstawił instrukcję przykładowego `.env` (mogę to od razu zrobić),
2. Czy wolisz wkleić wygenerowany pieprz do swojego `.env` ręcznie i uruchomić `docker-compose` samodzielnie?

Napisz którą opcję wybierasz, a ja zrobię aktualizację plików lub podam dokładne polecenia krok-po-kroku dla kolejnych kroków.
