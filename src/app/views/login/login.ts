import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Common } from '../../services/common';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { PushService } from '../../services/push';

@Component({
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  loginForm: any;
  isMobile: boolean = false;
  isLoaderVisible: boolean = false;
  errorMessage: any;
  email: any;
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  selectedPattern: number[] = [];
  constructor(private cdr: ChangeDetectorRef, private pushService: PushService, private breakpointObserver: BreakpointObserver, private fb: FormBuilder, private common: Common,
    private router: Router
  ) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });

  }

  selectNumber(number: number): void {

    this.selectedPattern.push(number);
    console.log('Selected pattern:', this.selectedPattern);
  }

  fill() {
    this.email += '@gmail.com';
    setTimeout(() => {
      this.passwordInput.nativeElement.focus();
    });
  }

  // loginWithPattern(){
  //   console.log('Logging in with pattern:', this.selectedPattern);
  //   this.onSubmit()
  // }

  clearPattern() {
    this.selectedPattern = [];
  }
  loginWithPattern() {
    this.isLoaderVisible = true;

    const password = this.selectedPattern.join('');

    this.common.login(password).subscribe({

      next: async (response: any) => { 
        this.isLoaderVisible = false;
        this.router.navigate(['/dashboard']);
        console.log(
          'Login successful:',
          response
        );


        // YOUR EXISTING LOGIN CODE

        sessionStorage.setItem(
          'token',
          response.token
        );

        sessionStorage.setItem(
          'userId',
          response.user._id
        );

        sessionStorage.setItem(
          'chatUserId',
          response.user.chatUserId
        );

        sessionStorage.setItem(
          'userName',
          response.user.name
        );

        console.log(response.user.notificationsEnabled)
        if (response.user.notificationsEnabled) {
          this.pushService.enablePush().catch(error => {
            console.error('Push registration failed:', error);
          });
        }




      },
      
      error: (error: any) => {
        this.isLoaderVisible = false; 
        if (error.status === 401) {
          this.errorMessage = 'Invalid pattern. Please try again.';
          console.log(this.errorMessage);
        } else {
          this.errorMessage = 'An error occurred during login. Please try again later.';
        } 
         this.cdr.detectChanges();
      }

    });

  }
}
