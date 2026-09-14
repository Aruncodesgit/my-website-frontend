import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from "@angular/common/http";
import { Injectable, Injector } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Router } from "@angular/router"; 
import { Common } from "./common";


@Injectable()

export class AuthInterceptor implements HttpInterceptor {

    constructor(private common : Common,private router : Router, private injector :Injector){}
 
 
    intercept(req: HttpRequest<any>, next: HttpHandler) {
        if (req.headers.get('noauth'))
            return next.handle(req.clone());
            
        else {
            const clonedreq = req.clone({
                headers: req.headers.set("Authorization", "Bearer " + this.common.getToken())
                
            });
            return next.handle(clonedreq).pipe(
               
            );
        }
         
    }
}