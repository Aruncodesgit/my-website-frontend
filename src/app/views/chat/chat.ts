import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Common } from '../../services/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { timer, Subscription } from 'rxjs';
import { exhaustMap, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
//import { Play } from './play/play';
const YT = (window as any).YT;
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
  heartbeatSubscription!: Subscription;
  accessChat: boolean = false;
  currentYoutubeVideoId: any;
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  isUserAtBottom = true;
  isInitialMessageLoad = true;
  replyingTo: any = null;
  constructor(private breakpointObserver: BreakpointObserver, public common: Common, private router: Router, private cdr: ChangeDetectorRef) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }


  ngOnInit() {

    this.userId = sessionStorage.getItem('userId');
    this.userName = sessionStorage.getItem('userName');
    // const youtubeUrl = sessionStorage.getItem('videoURL');
    // if (youtubeUrl) {

    //   this.selectedYoutubeUrl = this.getYoutubeEmbedUrl(youtubeUrl);

    //   // Optional: remove after reading
    //   sessionStorage.removeItem('selectedYoutubeUrl');
    // }
    this.getConversations()
    this.startHeartbeat();

    this.accessChat = [
      '6aa79fd3b0d5cd1f5fa84742',
      '6aa79fedb0d5cd1f5fa84744'
    ].includes(this.userId);
  }

  startHeartbeat() {
    this.heartbeatSubscription = timer(0, 10000)
      .pipe(
        exhaustMap(() => this.common.heartbeat())
      )
      .subscribe({
        next: (response: any) => {
          console.log('Heartbeat success');
        },
        error: (error: any) => {
          console.error('Heartbeat failed:', error);
        }
      });
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
        exhaustMap(() => this.common.getUserById(this.receiverId))
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

 startMessagePolling(): void {

  this.messageSubscription = timer(0, 500)
    .pipe(
      exhaustMap(() => this.common.getMessages())
    )
    .subscribe({

      next: (response: any) => {

        // Always make sure we have an array
        const newMessages: any[] =
          Array.isArray(response?.data)
            ? response.data
            : [];

        // Current last message
        const oldMessages: any[] =
          Array.isArray(this.messageData)
            ? this.messageData
            : [];

        const oldLastId =
          oldMessages.length > 0
            ? oldMessages[oldMessages.length - 1]?._id ?? null
            : null;

        // Server last message
        const newLastId =
          newMessages.length > 0
            ? newMessages[newMessages.length - 1]?._id ?? null
            : null;

        // Check whether a new message was added
        const hasNewMessage =
          oldLastId !== newLastId;

        // Update messages
        this.messageData = newMessages;

        // Only scroll when a new message arrives
        if (hasNewMessage && newMessages.length > 0) {
          this.scrollToBottom();
        }

        // Check unread messages safely
        const hasUnreadMessage =
          this.messageData.some(
            (msg: any) =>
              msg?.receiverId === this.userId &&
              msg?.isRead === false
          );

        if (hasUnreadMessage) {
          this.markMessagesAsRead();
        }

        this.cdr.detectChanges();
      },

      error: (error) => {
        console.error(
          'Failed to fetch messages:',
          error
        );
      }

    });
}

  onMessagesScroll(): void {

    if (!this.messagesContainer) return;

    const element = this.messagesContainer.nativeElement;

    const distanceFromBottom =
      element.scrollHeight -
      element.scrollTop -
      element.clientHeight;

    this.isUserAtBottom = distanceFromBottom <= 50;
  }

  scrollToBottom(force: boolean = false): void {
    setTimeout(() => {
      if (!this.messagesContainer) return;

      if (!force && !this.isUserAtBottom) {
        return;
      }

      const element = this.messagesContainer.nativeElement;

      element.scrollTop = element.scrollHeight;
    }, 0);
  }


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
      this.common.sendMessage({
        conversationId: this.conversationId,
        receiverId: this.receiverId,
        text: this.text.trim(),
        replyTo: this.replyingTo?._id || null
      }).subscribe({

        next: (response: any) => {

          console.log('Message sent successfully:', response);

          this.text = '';
          this.replyingTo = null;
          this.isMessageFocused = false;

          setTimeout(() => {
            this.messageInput.nativeElement.style.height = '52px';
          });

          this.cdr.detectChanges();
        },

        error: (error: any) => {
          console.error('Failed to send message:', error);
        }

      });
    }

  }

  scrollToMessage(messageId: string, event: MouseEvent) {

    event.stopPropagation();

    const element = document.getElementById(
      'message-' + messageId
    );

    if (element) {

      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      element.classList.add('reply-highlight');

      setTimeout(() => {
        element.classList.remove('reply-highlight');
      }, 1200);
    }
  }


  goDashboard() {
    this.router.navigate(['/dashboard'])
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
        this.common.clearStorage()
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

  replyMessage(msg: any, event: MouseEvent) {

    event.stopPropagation();

    this.replyingTo = msg;
    this.showCopyId = null;

    setTimeout(() => {
      this.messageInput.nativeElement.focus();
      this.isMessageFocused = true;
    });
  }
  cancelReply(event?: MouseEvent) {

    event?.stopPropagation();

    this.replyingTo = null;
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


  ngOnDestroy() {
    this.messageSubscription?.unsubscribe();
    this.readSubscription?.unsubscribe();
    this.onlineSubscription?.unsubscribe();
    this.heartbeatSubscription?.unsubscribe();

    this.showCopyId = ''
  }
}