import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout'; 
@Component({
  imports: [CommonModule],
  selector: 'app-chat',
  styleUrl: './chat.css',
  templateUrl: './chat.html',
})
export class Chat {
  isOnline:boolean = true;
  isMobile:boolean = false;
  constructor(private breakpointObserver: BreakpointObserver) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches; 
      });
}

}
