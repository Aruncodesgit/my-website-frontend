import { BreakpointObserver } from '@angular/cdk/layout';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Common } from '../../services/common';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'app-game',
  styleUrl: './game.css',
  templateUrl: './game.html',
})
export class Game implements OnInit {
  isMobile: boolean = false;
  userName: any;
  linkForm: any;
  errorList: any = []
  showLinkDrawer = false;
  links: any[] = [];
  cells: number[] = [];

  playerOnePosition = 1;
  playerTwoPosition = 1;
  diceNumber = 1;
  isRolling = false;

  dicePatterns: { [key: number]: number[] } = {
    1: [5],

    2: [1, 9],

    3: [1, 5, 9],

    4: [1, 3, 7, 9],

    5: [1, 3, 5, 7, 9],

    6: [1, 3, 4, 6, 7, 9]
  };
  constructor(private fb: FormBuilder, private breakpointObserver: BreakpointObserver, private cdr: ChangeDetectorRef, public common: Common, private router: Router) {
    this.breakpointObserver
      .observe(['(max-width: 767px)'])
      .subscribe(result => {
        this.isMobile = result.matches;
      });
  }
  ngOnInit(): void {
    this.createBoard()
  }


  createBoard(): void {
    this.cells = [];

    for (let row = 9; row >= 0; row--) {
      const start = row * 10 + 1;
      const end = start + 9;

      // Always Left → Right
      for (let i = start; i <= end; i++) {
        this.cells.push(i);
      }
    }
  }

  goDashboard() {

  }

  rollDice(): void {

    if (this.isRolling) {
      return;
    }

    this.isRolling = true;

    // Get dice result
    const dice = Math.floor(Math.random() * 6) + 1;

    // Show dice result
    this.diceNumber = dice;

    // Move player slowly
    this.movePlayer(dice);
  }

  movePlayer(steps: number): void {

    let currentStep = 0;

    const moveInterval = setInterval(() => {

      currentStep++;

      this.playerOnePosition++;

      this.cdr.detectChanges();

      console.log('Player position:', this.playerOnePosition);

      // Finished moving
      if (currentStep >= steps) {

        clearInterval(moveInterval);

        this.isRolling = false;

        this.cdr.detectChanges();

        console.log('Final position:', this.playerOnePosition);
      }

    }, 300);
  }


  isDotActive(position: number): boolean {
    return this.dicePatterns[this.diceNumber]?.includes(position) ?? false;
  }

}
