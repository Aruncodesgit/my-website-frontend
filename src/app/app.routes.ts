import { Routes } from '@angular/router';
import { Login } from './views/login/login';
import { Home } from './views/home/home';
import { Chat } from './views/chat/chat';
import { authGuard } from './guard/auth.guard';

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
        path: 'chat', component:Chat ,  canActivate: [authGuard]
    }
];
