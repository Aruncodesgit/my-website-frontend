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


  addYoutubeLink(youtubeUrl: string, comments: string) {
    return this.http.post(
      `${environment.apiProdUrl}/youtube`,
      {
        link: youtubeUrl,
        comments: comments
      },
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  getYoutubeLinks() {

    return this.http.get(
      `${environment.apiProdUrl}/youtube`,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );

  }

  getActivity() {

    return this.http.get(
      `${environment.apiProdUrl}/activity`,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );

  }


  deleteAllYoutubeLinks() {

    return this.http.delete(
      `${environment.apiProdUrl}/youtube`,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );

  }

  deleteAllActivity() {

    return this.http.delete(
      `${environment.apiProdUrl}/activity`,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );

  }

  markYoutubeAsRead(id: string) {
    return this.http.put(
      `${environment.apiProdUrl}/youtube/${id}/read`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }


  selectYoutubeVideo(data: any) {
    return this.http.post(
      `${environment.apiProdUrl}/currentPlay/select`,
      data,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

  getCurrentPlaying() { 
    return this.http.get(
      `${environment.apiProdUrl}/currentPlay`,
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }

    updatePlayback(data: { isPlaying: boolean; currentTime: number }) {
  return this.http.put(
    `${environment.apiProdUrl}/currentPlay/playback`,
    data,
    {
      headers: {
        Authorization: `Bearer ${this.getToken()}`
      }
    }
  );
}


  deleteCurrentPlay() {

    return this.http.delete(
      `${environment.apiProdUrl}/currentPlay`,
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

  heartbeat() {
    return this.http.post(
      `${environment.apiProdUrl}/logout/heartbeat`,
      {},
      {
        headers: {
          Authorization: `Bearer ${this.getToken()}`
        }
      }
    );
  }


  formatLastSeen(date: string): string {
    if (!date) {
      return '';
    }

    const d = new Date(date);
    const now = new Date();

    const today = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dateOnly = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate()
    );

    const time = d.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    if (dateOnly.getTime() === today.getTime()) {
      return `Today, ${time}`;
    }

    if (dateOnly.getTime() === yesterday.getTime()) {
      return `Yesterday, ${time}`;
    }

    return d.toLocaleString('en-IN', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  getToken() {
    return sessionStorage.getItem('token');
  }

  clearStorage() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
  }

}