import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WhatYouGet } from './what-you-get';

describe('WhatYouGet', () => {
  let component: WhatYouGet;
  let fixture: ComponentFixture<WhatYouGet>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WhatYouGet],
    }).compileComponents();

    fixture = TestBed.createComponent(WhatYouGet);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
