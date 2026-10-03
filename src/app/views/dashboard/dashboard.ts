import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Common } from '../../services/common';
import { timer, Subscription, exhaustMap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { PushService } from '../../services/push';

@Component({
  imports: [CommonModule, FormsModule],
  selector: 'app-dashboard',
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit, OnDestroy {
  isMobile: boolean = false;
  conversationId: any;
  userId: any;
  receiverId: any;
  isLoaderVisible: boolean = false;
  receiverUserName: any;
  receiverLastSeen: any;
  receiverisOnline: any;
  userName: any;
  onlineSubscription!: Subscription;
  heartbeatSubscription!: Subscription;
  activityData: any;
  accessChat: boolean = true;
  showDrawer = false;
  notificationsEnabled = false;

  constructor(private breakpointObserver: BreakpointObserver, private pushService: PushService, private cdr: ChangeDetectorRef, public common: Common, private router: Router) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  ngOnInit(): void {
    this.userId = sessionStorage.getItem('userId');
    this.userName = sessionStorage.getItem('userName');

    this.getConversations()
    this.startHeartbeat();
    this.getActivity()
    this.getNotificationSettings()
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
          //console.log('Heartbeat success');
        },
        error: (error: any) => {
          //console.error('Heartbeat failed:', error);
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
      },
      (error: any) => {
        // console.error('Failed to fetch conversations:', error);
      }
    );
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


  getActivity() {

    this.common.getActivity().subscribe(
      (response: any) => {
        this.activityData = response.data
        //console.log(this.activityData)
      },
      (error: any) => {
        //console.error('Failed to fetch conversations:', error);
      }
    );
  }


  openChat() {
    this.router.navigate(['/chat'])
  }

  goYoutube() {
    this.router.navigate(['/youtube'])
  }

    toggleNotifications() { 

    const payload = {
      enabled: this.notificationsEnabled
    };

    if (payload.enabled) {

      this.pushService.enablePush();

    }

   this.common.updateNotificationSettings(payload.enabled).subscribe(
      (response: any) => {
        // Handle success if needed
      },
      (error: any) => {
        // Handle error if needed
      }
    );   
  }

  getNotificationSettings() {
    this.common.getNotificationSettings().subscribe(
      (response: any) => { 
        this.notificationsEnabled = response.notificationsEnabled;
      
      } 
    )}            



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
        // console.error('Logout failed:', error);
      }
    );
  }

  ngOnDestroy() {
    this.onlineSubscription?.unsubscribe();
    this.heartbeatSubscription?.unsubscribe();
  }
}
