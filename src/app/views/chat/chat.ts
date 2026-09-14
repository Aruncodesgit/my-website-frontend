import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Common } from '../../services/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { timer, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
@Component({
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-chat',
  styleUrl: './chat.css',
  templateUrl: './chat.html',
})
export class Chat implements OnInit, OnDestroy, AfterViewInit {
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
  constructor(private breakpointObserver: BreakpointObserver, private common: Common, private router: Router, private cdr: ChangeDetectorRef) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }


  ngOnInit() {

    this.userId = localStorage.getItem('userId');
    this.userName = localStorage.getItem('userName');
    this.getConversations()


  }
  ngAfterViewInit() {
    setTimeout(() => {
      this.messageInput.nativeElement.focus();
    });
  }


  getConversations() {

    this.common.getConversations().subscribe(
      (response: any) => {
        console.log('Conversations fetched successfully:', response);
        this.conversationId = response.data[0]._id;
        var receiverID = response.data[0].participants
        receiverID = receiverID.filter((id: any) => id !== this.userId);
        this.receiverId = receiverID[0];

        this.startGettingOnlinePolling();
        this.startMessagePolling();
        this.startReadMessagePolling();
      },
      (error: any) => {
        console.error('Failed to fetch conversations:', error);
      }
    );
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
          console.log('Receiver online:', this.receiverisOnline);

          this.cdr.detectChanges();

        },
        error: (error) => {
          console.error('Failed to fetch messages:', error);
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
          
          this.cdr.detectChanges();

        },
        error: (error) => {
          console.error('Failed to fetch messages:', error);
        }
      });
  }


  startReadMessagePolling() {

    this.readSubscription = timer(0, 1000)
      .pipe(
        switchMap(() =>
          this.common.readMessage(this.conversationId)
        )
      )
      .subscribe({
        next: () => {

          console.log(
            'Messages marked as read:',
            this.conversationId
          );

        },
        error: (error) => {
          console.error('Read message failed:', error);
        }
      });
  }


  sendMessage() {
    this.common.sendMessage({ conversationId: this.conversationId, receiverId: this.receiverId, text: this.text }).subscribe(
      (response: any) => {
        console.log('Message sent successfully:', response);
        this.text = '';
        setTimeout(() => {
          this.messageInput.nativeElement.focus();
        });
        this.cdr.detectChanges()
      },
      (error: any) => {
        console.error('Failed to send message:', error);
      }
    );
  }



  logout() {
    const id = localStorage.getItem('userId');

    if (!id) {
      localStorage.removeItem('token');
      this.router.navigate(['/login']);
      return;
    }

    this.common.logout(id).subscribe(
      (response: any) => {
        this.router.navigate(['/login']);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
      },
      (error: any) => {
        console.error('Logout failed:', error);
      }
    );

  }


  formatLastSeen(date: string): string {
    if (!date) {
      return '';
    }

    const d = new Date(date);

    return d.toLocaleString('en-IN', {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  deleteAllMessages() {
    this.common.deleteAllMessages().subscribe(
      (response: any) => {
        this.messageData = [];
        this.cdr.detectChanges();
      },
      (error: any) => {
        console.error('Failed to delete all messages:', error);
      }
    );
  }

  clickMessage(id: string) {
    if (this.showCopyId === id) {
      // Click the same message again → close
      this.showCopyId = null;
    } else {
      // Click another message → show only that message
      this.showCopyId = id;
    }
  }

  deleteMessageById(id: string) {   
    this.common.deleteById(id).subscribe(res => {

    })

  }

  ngOnDestroy() {
    this.messageSubscription?.unsubscribe();
    this.readSubscription?.unsubscribe();
    this.onlineSubscription?.unsubscribe();
    this.showCopyId = ''
  }
}