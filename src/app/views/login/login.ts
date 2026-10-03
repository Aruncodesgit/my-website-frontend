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

  fill() {
    this.email += '@gmail.com';
    setTimeout(() => {
      this.passwordInput.nativeElement.focus();
    });
  }


  onSubmit() {
    this.isLoaderVisible = true;
    this.common.login(this.loginForm.value).subscribe({

      next: async (response: any) => {

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
          'userName',
          response.user.name
        );


        // REGISTER THIS BROWSER FOR PUSH
        await this.pushService.enablePush();


        this.router.navigate([
          '/dashboard'
        ]);

      },

      error: (error: any) => {

        console.error(
          'Login failed:',
          error
        );

      }

    });
  }
}
