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

  getUserById(id: string) {
    return this.http.get(
      `${environment.apiProdUrl}/user/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  getConversations() {
    return this.http.get(
      environment.apiProdUrl + '/conversation',
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }


  sendMessage(data: any) {
    return this.http.post(
      environment.apiProdUrl + '/message', data,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  getMessages() {
    return this.http.get(
      environment.apiProdUrl + '/message',
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  readMessage(id: string) {

    return this.http.put(
      `${environment.apiProdUrl}/message/${id}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  } 

   deleteAllMessages() {
    return this.http.delete(
      environment.apiProdUrl + '/message',
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

    deleteById(id: string) {
  return this.http.delete(
        `${environment.apiProdUrl}/message/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`
          }
        }
      );
    }

     editMessage(id: string, text: string) {
  return this.http.put(
        `${environment.apiProdUrl}/message/${id}`,
         {
      text: text
    },
        {
          headers: {
            Authorization: `Bearer ${this.getToken()}`
          }
        }
      );
    }

  logout(id: string) {

    return this.http.post(
      `${environment.apiProdUrl}/logout/${id}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  

  getToken() {
    return sessionStorage.getItem('token');
  }

}