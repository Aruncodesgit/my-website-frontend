import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Common } from '../../services/common';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { exhaustMap, Subscription, timer } from 'rxjs';


@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-youtube',
  styleUrl: './youtube.css',
  templateUrl: './youtube.html',
})
export class Youtube implements OnInit {
  isMobile: boolean = false;
  userName: any;
  linkForm: any;
  errorList: any = []
  showLinkDrawer = false;
  links: any[] = [];
  heartbeatSubscription!: Subscription;
  youtubeSubscription!: Subscription;
  accessChat: boolean = true;
  userId:any;
  constructor(private fb: FormBuilder, private breakpointObserver: BreakpointObserver, private cdr: ChangeDetectorRef, public common: Common, private router: Router) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
  ngOnInit(): void {
    this.userId = sessionStorage.getItem('userId');
    this.userName = sessionStorage.getItem('userName');

    this.linkForm = this.fb.group({
      id: ['', [Validators.required]],
      comments: [''],
      link: ['', [Validators.required]]
    });
 
    this.getYoutubeLinks()

    this.accessChat = [
      '6aa79fd3b0d5cd1f5fa84742',
      '6aa79fedb0d5cd1f5fa84744'
    ].includes(this.userId);
  }

 
  goDashboard() {
    this.router.navigate(['/dashboard'])
  }

  deleteAllLinks() {
    this.common.deleteAllYoutubeLinks().subscribe({
      next: (response: any) => {
        this.getYoutubeLinks()
        if (response.success) {
          this.links = [];
          this.cdr.detectChanges()
        }

      },
      error: (error) => {
        console.error('Delete all error:', error);
      }
    });
    this.common.deleteAllActivity().subscribe({
      next: (response: any) => {
      },
      error: (error) => {
        console.error('Delete all error:', error);
      }
    });
  }

  sendCurrentPlay(link: any) {
    const data = {
      //conversationId: this.conversationId,
      youtubeLinkId: link._id
    };

    this.common.selectYoutubeVideo(data).subscribe({
      next: (response: any) => {
 

      },
      error: (error) => {
        console.error('Select YouTube video error:', error);
      }
    });
  }
   
  markYoutubeLinkAsRead(link: any, source:any) {
    this.sendCurrentPlay(link) 
    if(source == 'chat'){
       this.router.navigate(['/chat'])
    }
   
    if (link.isRead) {
      return;
    }

    this.common.markYoutubeAsRead(link._id).subscribe({
      next: (response: any) => {
        console.log(response)
        if (response.success) {
          link.isRead = true;
        }

      },
      error: (error) => {
        console.error('Mark YouTube link as read error:', error);
      }
    });
  }

  getYoutubeLinks() {

    this.youtubeSubscription = timer(0, 10000)
      .pipe(
        exhaustMap(() => this.common.getYoutubeLinks())
      )
      .subscribe({
        next: (response: any) => {
          this.links = response.data;

          this.cdr.detectChanges()
        },
        error: (error: any) => {
          console.error('Heartbeat failed:', error);
        }
      });
  }

  onSubmit() {
    const youtubeUrl = this.linkForm.get('link')?.value;
    const comments = this.linkForm.get('comments')?.value || '';
    this.common.addYoutubeLink(youtubeUrl, comments).subscribe({
      next: (response: any) => {
        console.log(response)
        if (response.success) {

          this.linkForm.reset();

          this.showLinkDrawer = false;

          this.getYoutubeLinks();

        }

      },
      error: (error) => {
        console.error(error);
      }
    });

  }

  ngOnDestroy() {
    this.heartbeatSubscription?.unsubscribe();
    this.youtubeSubscription?.unsubscribe();
  }
}
