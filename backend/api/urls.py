from django.urls import path
from .views import hello, logout_view, register, login_view, debug_users, debug_delete_users

urlpatterns = [
    path('hello/', hello),
    path('register/', register),
    path('login/', login_view),
    path("debug/users/", debug_users),
    path("debug/all_users/", debug_delete_users),
    path('logout/', logout_view),
]
