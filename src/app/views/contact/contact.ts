import { Component, signal, AfterViewInit, OnInit, ChangeDetectorRef } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Common } from '../../services/common';
@Component({
  imports: [CommonModule, ReactiveFormsModule],
  selector: 'app-contact',
  styleUrl: './contact.css',
  templateUrl: './contact.html',
})
export class Contact { 
  contactForm: any;
  successMessage: boolean = false;
  errorList: any = []
  isMenuActive = 1
  isLoading: boolean = false;
  constructor(private fb: FormBuilder, private common: Common, private cdr: ChangeDetectorRef) { }



  ngOnInit() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      message: ['', [Validators.required]]
    });
  }

  toggleMenu(value: any) {
    this.isMenuActive = value
    if (value == 0) {
      document.body.classList.add('mobile-nav-active');
    }
    else {
      document.body.classList.remove('mobile-nav-active');
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.common.contact(this.contactForm.value).subscribe({
      next: (res: any) => {
        console.log(res);
        this.successMessage = true;
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = false;
          this.contactForm.reset()
          this.isLoading = false;
        }, 2000);
        this.cdr.detectChanges()
      },

      error: (err: any) => {
         this.isLoading = false;
        this.errorList = err.error;
        setTimeout(() => {
          this.errorList = [];
        }, 2000);
        this.cdr.detectChanges()
      }
    });
  }
}
