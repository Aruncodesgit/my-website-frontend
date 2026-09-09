import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';  
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Common {

  private http = inject(HttpClient);

  contact(data: any) {
    return this.http.post(
      environment.apiProdUrl + '/contact',
      data
    );
  }

  login(data: any) {
    return this.http.post(
      environment.apiProdUrl + '/login',
      data
    );
  }


  getToken()  {
     return localStorage.getItem('token');
  }
}