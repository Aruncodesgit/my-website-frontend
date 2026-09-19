import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Common } from '../../services/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
@Component({
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-chat',
  styleUrl: './chat.css',
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnDestroy {
  isOnline: boolean = true;
  isMobile: boolean = false;
  userId: any;
  receiverId: any;
  text: any;
  conversationId: any;
  messageSubscription!: Subscription;
  readSubscription!: Subscription;
  onlineSubscription!: Subscription;
  messageData: any;
  userName: any;
  receiverUserName: any;
  receiverLastSeen: any;
  receiverisOnline: any;
  @ViewChild('messageInput') messageInput!: ElementRef;
  showCopyId: any = null;
  isLoaderVisible: boolean = false;
  isMessageFocused = false;
  editingMessageId: any
  constructor(private breakpointObserver: BreakpointObserver, private common: Common, private router: Router, private cdr: ChangeDetectorRef) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }


  ngOnInit() {

    this.userId = sessionStorage.getItem('userId');
    this.userName = sessionStorage.getItem('userName');
    this.getConversations()


  }


  getConversations() {

    this.common.getConversations().subscribe(
      (response: any) => {
        this.conversationId = response.data[0]._id;
        var receiverID = response.data[0].participants
        receiverID = receiverID.filter((id: any) => id !== this.userId);
        this.receiverId = receiverID[0];

        this.startGettingOnlinePolling();
        this.startMessagePolling();
        //this.startReadMessagePolling();
        this.markMessagesAsRead();
      },
      (error: any) => {
        console.error('Failed to fetch conversations:', error);
      }
    );
  }


  markMessagesAsRead() {
    this.common.readMessage(this.conversationId).subscribe(res => {

    })
  }

  startGettingOnlinePolling() {

    this.onlineSubscription = timer(0, 1000)
      .pipe(
        switchMap(() => this.common.getUserById(this.receiverId))
      )
      .subscribe({
        next: (response: any) => {

          const receiver = response.data;

          this.receiverUserName = receiver.name;
          this.receiverLastSeen = receiver.lastSeen;
          this.receiverisOnline = receiver.isOnline;

          this.cdr.detectChanges();

        },
        error: (error) => {

        }
      });
  }

  startMessagePolling() {

    this.messageSubscription = timer(0, 1000)
      .pipe(
        switchMap(() => this.common.getMessages())
      )
      .subscribe({
        next: (response: any) => {

          this.messageData = response.data;
          const hasUnreadMessage = this.messageData.some(
            (msg: any) =>
              msg.receiverId === this.userId &&
              msg.isRead === false
          );

          if (hasUnreadMessage) {
            this.markMessagesAsRead();
          }
          this.cdr.detectChanges();

        },
        error: (error) => {
          console.error('Failed to fetch messages:', error);
        }
      });
  }


  // startReadMessagePolling() {

  //   this.readSubscription = timer(0, 1000)
  //     .pipe(
  //       switchMap(() =>
  //         this.common.readMessage(this.conversationId)
  //       )
  //     )
  //     .subscribe({
  //       next: () => {

  //       },
  //       error: (error) => {

  //       }
  //     });
  // }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.isMessageFocused = false;
  }

  focusMessage(event: MouseEvent) {
    event.stopPropagation();
    this.isMessageFocused = true;
  }

  sendMessage() {

    if (this.editingMessageId) {
      this.common.editMessage(this.editingMessageId, this.text).subscribe(res => {
        if (res) {
          this.editingMessageId = null;
          this.text = '';
          this.isMessageFocused = false;
          this.cdr.detectChanges();
        }
      },
        (error: any) => {

        })
    }
    else {
      this.common.sendMessage({ conversationId: this.conversationId, receiverId: this.receiverId, text: this.text }).subscribe(
        (response: any) => {
          this.isMessageFocused = false;
          console.log('Message sent successfully:', response);
          this.text = '';
          setTimeout(() => {
            this.messageInput.nativeElement.style.height = '52px';
            //   this.messageInput.nativeElement.focus();
            //   this.isMessageFocused = true;
          });
          this.cdr.detectChanges()
        },
        (error: any) => {
          console.error('Failed to send message:', error);
        }
      );
    }

  }



  logout() {
    const id = sessionStorage.getItem('userId');

    this.isLoaderVisible = true;
    if (!id) {
      sessionStorage.removeItem('token');
      this.router.navigate(['/login']);
      return;
    }

    this.common.logout(id).subscribe(
      (response: any) => {
        this.isLoaderVisible = false
        this.router.navigate(['/login']);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('userName');
      },
      (error: any) => {
        this.isLoaderVisible = false
        console.error('Logout failed:', error);
      }
    );

  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;

    // Keep normal height until 50 characters 
    if (textarea.value.length <= 50) {
      textarea.style.height = '52px';
      textarea.style.overflowY = 'hidden';
      return;
    }

    // Start increasing after 50 characters
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';

    // Maximum height
    if (textarea.scrollHeight > 120) {
      textarea.style.height = '120px';
      textarea.style.overflowY = 'auto';
    } else {
      textarea.style.overflowY = 'hidden';
    }
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

  deleteAllMessages() {
    this.isLoaderVisible = true;
    this.common.deleteAllMessages().subscribe(
      (response: any) => {
        setTimeout(() => {
          this.isLoaderVisible = false;
        }, 1000);
        this.messageData = [];
        this.cdr.detectChanges();
      },
      (error: any) => {
        setTimeout(() => {
          this.isLoaderVisible = false;
        }, 1000);
        console.error('Failed to delete all messages:', error);
      }
    );
  }

  clickMessage(id: string, event: MouseEvent) {
    event.stopPropagation();

    if (this.showCopyId === id) {
      this.showCopyId = null;
    } else {
      this.showCopyId = id;
    }
  }

  closeDropDown() {
    this.showCopyId = null;
  }

  deleteMessageById(id: string) {
    this.isLoaderVisible = true;
    this.common.deleteById(id).subscribe(res => {
      if (res) {
        setTimeout(() => {
          this.isLoaderVisible = false;
        }, 1000);
      }
    },
      (error: any) => {
        setTimeout(() => {
          this.isLoaderVisible = false;
        }, 1000);
      })

  }


  editMessage(id: string, text: any) {
    this.editingMessageId = id
    this.text = text;
    this.showCopyId = null;

    setTimeout(() => {
      this.messageInput.nativeElement.focus();
      this.isMessageFocused = true;
    });
  }

  copyMessage(text: string, event: MouseEvent) {
    event.stopPropagation();

    navigator.clipboard.writeText(text).then(() => {
      this.showCopyId = null;
    });
  }

  testBrowserClose() {
    
    const userId = sessionStorage.getItem('userId');
    navigator.sendBeacon(
      `${environment.apiBaseUrl}/logout/browser-close`,
      userId
    );
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
  }

  @HostListener('window:pagehide')
  onPageHide() {

    const userId = sessionStorage.getItem('userId');
    navigator.sendBeacon(
      `${environment.apiBaseUrl}/logout/browser-close`,
      userId
    );
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('userName');
  }

  ngOnDestroy() {
    this.messageSubscription?.unsubscribe();
    this.readSubscription?.unsubscribe();
    this.onlineSubscription?.unsubscribe();
    this.showCopyId = ''
  }
}