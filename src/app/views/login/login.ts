import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Common } from '../../services/common';
import { CommonModule } from '@angular/common';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';

@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login implements OnInit {
  loginForm: any;
  isMobile: boolean = false;
  constructor(private breakpointObserver: BreakpointObserver, private fb: FormBuilder, private common: Common,
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
  onSubmit() {
    this.common.login(this.loginForm.value).subscribe(
      (response: any) => {
        console.log('Login successful:', response);
        localStorage.setItem('token', response.token);
        localStorage.setItem('userName', response.user.name);

        localStorage.setItem('userId', response.user.id);
        this.router.navigate(['/chat']);
      },
      (error: any) => {
        console.error('Login failed:', error);
      }
    );
  }
}
