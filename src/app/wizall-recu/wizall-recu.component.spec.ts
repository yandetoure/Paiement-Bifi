import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WizallRecuComponent } from './wizall-recu.component';

describe('WizallRecuComponent', () => {
  let component: WizallRecuComponent;
  let fixture: ComponentFixture<WizallRecuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WizallRecuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WizallRecuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
