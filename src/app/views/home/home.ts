import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { Common } from '../../services/common';
import { About } from '../about/about';
import { Contact } from '../contact/contact';
import { Cta } from '../cta/cta';
import { HowIwork } from '../how-iwork/how-iwork';
import { Services } from '../services/services';
import { WhatYouGet } from '../what-you-get/what-you-get';
import { Work } from '../work/work';
declare var AOS: any;
@Component({
  imports: [CommonModule, RouterOutlet, ReactiveFormsModule, Contact, About, Services, Work, WhatYouGet, HowIwork, Cta],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})

export class Home implements AfterViewInit, OnInit {
  protected readonly title = signal('my-website');
  contactForm: any; 
  successMessage: boolean = false; 
  errorList:any = []
  isMenuActive = 1
  constructor(private fb: FormBuilder, private common: Common, private cdr: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true
    });
  }

  ngOnInit() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      message: ['', [Validators.required]]
    });

    const preloader = document.getElementById('preloader');

    if (preloader) {
      preloader.style.opacity = '0';

      setTimeout(() => {
        preloader.remove();
      }, 500);
    }
  }

  toggleMenu(value:any) {
    this.isMenuActive = value
     if(value == 0) {
document.body.classList.add('mobile-nav-active');
     }
     else {
      document.body.classList.remove('mobile-nav-active');
     }
  }

  onSubmit() {
    this.common.contact(this.contactForm.value).subscribe({
      next: (res: any) => {
        console.log(res); 
        this.successMessage = true;

        setTimeout(() => {
          this.successMessage = false;
          this.contactForm.reset()
        }, 2000);
         this.cdr.detectChanges()
      },

      error: (err: any) => {  
        this.errorList = err.error;
        setTimeout(() => {
          this.errorList = [];
        }, 2000);
         this.cdr.detectChanges()
      }
    });
  }
}
