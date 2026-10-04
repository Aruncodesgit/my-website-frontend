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
  messageData: any[] = [];
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
  isKeyboardOpen = false;
  private lastMessageId: string | null = null;
  replyingTo: any = null;
  private initialViewportHeight = window.visualViewport?.height || window.innerHeight;
  private pendingMessageIds = new Set<string>();
  private scrollInterval: any;
  constructor(private breakpointObserver: BreakpointObserver, public common: Common, private router: Router, private cdr: ChangeDetectorRef) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }


  ngOnInit() {

    this.userId = sessionStorage.getItem('userId');
    this.receiverId = sessionStorage.getItem('chatUserId');
    this.userName = sessionStorage.getItem('userName');
    // const youtubeUrl = sessionStorage.getItem('videoURL');
    // if (youtubeUrl) {

    //   this.selectedYoutubeUrl = this.getYoutubeEmbedUrl(youtubeUrl);

    //   // Optional: remove after reading
    //   sessionStorage.removeItem('selectedYoutubeUrl');
    // }

    if (window.visualViewport) {

      window.visualViewport.addEventListener(
        'resize',
        this.viewportResizeHandler
      );
    }

    this.startGettingOnlinePolling();
    this.getConversations()
    this.startHeartbeat();

    this.accessChat = [
      '6aa79fd3b0d5cd1f5fa84742',
      '6aa79fedb0d5cd1f5fa84744'
    ].includes(this.userId);

    this.scrollInterval = setInterval(() => {
      this.scrollToBottom();
    }, 100);
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

    this.onlineSubscription = timer(0, 200)
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

    this.messageSubscription = timer(0, 200)
      .pipe(
        exhaustMap(() => this.common.getMessages())
      )
      .subscribe({

        next: (response: any) => {

          const serverMessages: any[] =
            Array.isArray(response?.data)
              ? response.data
              : [];

          const localMessages: any[] =
            Array.isArray(this.messageData)
              ? this.messageData
              : [];

          // Keep temporary messages that are
          // not yet represented by server data
          const temporaryMessages =
            localMessages.filter(
              (msg: any) =>
                msg?.isTemp === true
            );

          //this.scrollToBottom();
          // --------------------------------
          // SERVER DATA
          // --------------------------------

          const serverMessageTexts =
            new Set(
              serverMessages.map(
                (msg: any) =>
                  `${msg.senderId}_${msg.text}_${msg.createdAt}`
              )
            );

          // Keep only temp messages that
          // haven't appeared from backend yet
          const pendingTemporary =
            temporaryMessages.filter(
              (temp: any) => {

                return !serverMessages.some(
                  (server: any) =>
                    server.senderId === temp.senderId &&
                    server.text === temp.text
                );

              }
            );

          // --------------------------------
          // UPDATE
          // --------------------------------

          this.messageData = [
            ...serverMessages,
            ...pendingTemporary
          ];

          // --------------------------------
          // READ
          // --------------------------------

          const hasUnreadMessage =
            serverMessages.some(
              (msg: any) =>
                msg?.receiverId === this.userId &&
                msg?.isRead === false
            );

          if (hasUnreadMessage) {
            this.markMessagesAsRead();
          }

          this.cdr.detectChanges();

        },

        error: (error: any) => {

          console.error(
            'Message polling error:',
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

  scrollToBottom(): void {
    if (!this.messagesContainer) return;

    // User manually scrolled up
    if (!this.isUserAtBottom) return;

    const element = this.messagesContainer.nativeElement;

    element.scrollTop = element.scrollHeight;
  }




  private viewportResizeHandler = () => {

    if (!this.isMobile) {
      return;
    }

    const viewportHeight =
      window.visualViewport?.height ||
      window.innerHeight;

    const heightDifference =
      window.innerHeight - viewportHeight;

    if (heightDifference > 150) {

      this.isKeyboardOpen = true;

    } else {

      this.isKeyboardOpen = false;
    }
  };

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

      this.common.editMessage(
        this.editingMessageId,
        this.text
      ).subscribe((res: any) => {

        if (res) {
          this.editingMessageId = null;
          this.text = '';
          this.isMessageFocused = false;
          this.cdr.detectChanges();
        }

      });

      return;
    }

    const messageText = this.text?.trim();

    if (!messageText) {
      return;
    }

    const replyTo = this.replyingTo;

    // Generate a local ID
    const tempId = 'temp-' + Date.now();

    // Create local message
    const localMessage: any = {

      _id: tempId,

      conversationId: this.conversationId,

      senderId: this.userId,

      receiverId: this.receiverId,

      text: messageText,

      createdAt: new Date(),

      isRead: false,

      isEdited: false,

      replyTo: replyTo || null,

      isTemp: true
    };

    // --------------------------------
    // SHOW IMMEDIATELY
    // --------------------------------

    this.messageData = [
      ...this.messageData,
      localMessage
    ];

    this.isUserAtBottom = true;


    // Clear input immediately
    this.text = '';
    this.replyingTo = null;
    this.isMessageFocused = false;

    this.cdr.detectChanges();

    // Scroll immediately
    requestAnimationFrame(() => {
      this.scrollToBottom();
    });

    // --------------------------------
    // SEND TO BACKEND
    // --------------------------------

    this.common.sendMessage({

      conversationId: this.conversationId,

      receiverId: this.receiverId,

      text: messageText,

      replyTo: replyTo?._id || null

    }).subscribe({

      next: (response: any) => {

        const savedMessage = response?.data;

        if (!savedMessage) {
          return;
        }

        // --------------------------------
        // REPLACE TEMP MESSAGE
        // WITHOUT RELOADING WHOLE LIST
        // --------------------------------

        const index =
          this.messageData.findIndex(
            (msg: any) =>
              msg._id === tempId
          );

        if (index !== -1) {

          this.messageData[index] =
            savedMessage;

          // IMPORTANT:
          // Don't replace the entire array.
          // Don't scroll.
          // Don't reload messages. 
          this.cdr.detectChanges();
        }

      },

      error: (error: any) => {

        console.error(
          'Send message error:',
          error
        );

        // Remove temporary message if API fails

        this.messageData =
          this.messageData.filter(
            (msg: any) =>
              msg._id !== tempId
          );

        this.cdr.detectChanges();
      }

    });

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
        this.isLoaderVisible = false;
        this.messageData = [];
        this.cdr.detectChanges();
      },
      (error: any) => {
        this.isLoaderVisible = false; 
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
    if (this.scrollInterval) {
      clearInterval(this.scrollInterval);
    }
    if (window.visualViewport) {

      window.visualViewport.removeEventListener(
        'resize',
        this.viewportResizeHandler
      );
    }


    this.showCopyId = ''
  }
}