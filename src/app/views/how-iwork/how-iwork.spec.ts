import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HowIwork } from './how-iwork';

describe('HowIwork', () => {
  let component: HowIwork;
  let fixture: ComponentFixture<HowIwork>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HowIwork],
    }).compileComponents();

    fixture = TestBed.createComponent(HowIwork);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
