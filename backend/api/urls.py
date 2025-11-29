from django.urls import path
from .views import (
    hello, logout_view, register, login_view,
    debug_users, debug_delete_users,
    setup_2fa, confirm_2fa_setup, verify_2fa_login
)

urlpatterns = [
    path('hello/', hello),
    path('register/', register),
    path('login/', login_view),

    # Nowe ścieżki 2FA
    path('login/2fa/', verify_2fa_login),
    path('2fa/setup/', setup_2fa),
    path('2fa/confirm/', confirm_2fa_setup),

    path("debug/users/", debug_users),
    path("debug/all_users/", debug_delete_users),
    path('logout/', logout_view),
]