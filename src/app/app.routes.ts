import { Routes } from '@angular/router';
import { Login } from './views/login/login';
import { Home } from './views/home/home';
import { Chat } from './views/chat/chat';
import { authGuard } from './guard/auth.guard';
import { Dashboard } from './views/dashboard/dashboard';
import { Youtube } from './views/youtube/youtube';
import { Game } from './views/game/game';

export const routes: Routes = [
    {
        path: '',  redirectTo: 'home', pathMatch: 'full'
    },
    {
        path: 'home', component:Home
    },
    {
        path: 'login', component:Login
    },
    {
        path: 'dashboard', component:Dashboard ,  canActivate: [authGuard]
    },
    {
        path: 'chat', component:Chat ,  canActivate: [authGuard]
    },
     {
        path: 'youtube', component:Youtube ,  canActivate: [authGuard]
    },
     {
        path: 'game', component:Game ,  canActivate: [authGuard]
    }
];
