import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MapaEntregasComponent } from './mapa-entregas.component';

describe('MapaEntregasComponent', () => {
  let component: MapaEntregasComponent;
  let fixture: ComponentFixture<MapaEntregasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MapaEntregasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MapaEntregasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
